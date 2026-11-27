import "server-only";

import { z } from "zod";
import {
  type AccessActor,
  isAdministrator,
  permitsBranch,
} from "@/features/identity/permissions";
import {
  assertPermission,
  IdentityError,
} from "@/features/identity/server/access";
import { enqueueWhatsApp } from "@/features/whatsapp/server/notifications";
import {
  businessDateStartUtc,
  businessDateString,
  businessYearMonth,
} from "@/lib/date/business-date";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/db/generated/client";

type Tx = Prisma.TransactionClient;

export const createDeliverySheetInput = z.strictObject({
  manifestId: z.coerce.number().int().positive(),
  sheetNo: z.string().trim().min(1).max(50),
  deliveryDate: z.iso.date(),
});

/**
 * One delivery sheet (DRS) per manifest (delivery_sheets.manifest_id is
 * unique). Outcomes are recorded through the existing Dev 2 service.
 */
export async function createDeliverySheet(actor: AccessActor, input: unknown) {
  assertPermission(actor, "create", "delivery");
  const data = createDeliverySheetInput.parse(input);
  return prisma.$transaction(async (tx) => {
    const manifest = await tx.manifest.findFirst({
      where: { id: data.manifestId, deletedAt: null },
      select: { id: true, branchId: true, status: true },
    });
    if (
      !manifest?.branchId ||
      (!isAdministrator(actor) && !permitsBranch(actor, manifest.branchId))
    )
      throw new IdentityError("FORBIDDEN_BRANCH", 403);
    if (manifest.status === "Closed")
      throw new IdentityError("CONFLICT", 409, "Manifest sudah ditutup.");
    const sheet = await tx.deliverySheet.create({
      data: {
        manifestId: manifest.id,
        branchId: manifest.branchId,
        sheetNo: data.sheetNo,
        deliveryDate: new Date(`${data.deliveryDate}T00:00:00.000Z`),
        // deliveredBy means the delivering user, not the creator; the courier
        // is the manifest's courier, so it stays unset here.
      },
    });
    // Every AWB actively on the manifest is now out for delivery.
    const items = await tx.manifestItem.findMany({
      where: { manifestId: manifest.id, deletedAt: null, releasedAt: null },
      select: { transactionId: true },
    });
    for (const item of items)
      await enqueueWhatsApp(tx, ["DELIVERY_SHEET"], item.transactionId, {
        branchId: manifest.branchId,
        payload: { deliverySheetId: sheet.id },
      });
    return sheet;
  });
}

// ---------------------------------------------------------------------------
// Standalone DRS (Modul > Operasional > Lembar Pengantaran > Kurir Kota).
// Provider OBSERVED form: DRS No., Tanggal, Kurir, Driver, Nopol, Status
// (Tujuan / Agent), Agent, Keterangan. Simplified per D-35: AWBs are added
// one by one, outcomes reuse the manifest DRS outcome service.
// ---------------------------------------------------------------------------

const optionalId = z.preprocess(
  (v) => (v === "" || v === null ? undefined : v),
  z.coerce.number().int().positive().optional(),
);

export const standaloneSheetInput = z.strictObject({
  branchId: z.coerce.number().int().positive(),
  sheetNo: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(50).optional(),
  ),
  deliveryDate: z.iso.date(),
  courierId: z.coerce.number().int().positive(),
  driverId: optionalId,
  vehicleId: optionalId,
  agentId: optionalId,
  remarks: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(500).optional(),
  ),
});

export const sheetAwbInput = z.strictObject({
  deliverySheetId: z.coerce.number().int().positive(),
  awbNo: z.string().trim().min(1).max(50),
});

export const sheetLineInput = z.strictObject({
  deliverySheetId: z.coerce.number().int().positive(),
  transactionId: z.coerce.number().int().positive(),
});

const FINAL = ["DELIVERED", "RETURNED"];

function forbidden(): never {
  throw new IdentityError("FORBIDDEN_BRANCH", 403);
}

function conflict(message: string): never {
  throw new IdentityError("CONFLICT", 409, message);
}

/** Courier, driver, vehicle and agent must be usable by the DRS branch. */
async function assertResources(
  tx: Tx,
  branchId: number,
  data: z.infer<typeof standaloneSheetInput>,
) {
  const usable = { deletedAt: null, status: "ACTIVE" as const };
  const inBranch = { OR: [{ branchId: null }, { branchId }] };
  const [courier, driver, vehicle, agent] = await Promise.all([
    tx.courier.findFirst({
      where: { id: data.courierId, ...usable, ...inBranch },
      select: { id: true },
    }),
    data.driverId
      ? tx.driver.findFirst({
          where: { id: data.driverId, ...usable, ...inBranch },
          select: { id: true },
        })
      : null,
    data.vehicleId
      ? tx.vehicle.findFirst({
          where: { id: data.vehicleId, ...usable, ...inBranch },
          select: { id: true },
        })
      : null,
    data.agentId
      ? tx.agent.findFirst({
          where: { id: data.agentId, deletedAt: null, status: "ACTIVE" },
          select: { id: true },
        })
      : null,
  ]);
  if (!courier) conflict("Kurir tidak aktif atau bukan dari cabang ini.");
  if (data.driverId && !driver)
    conflict("Driver tidak aktif atau bukan dari cabang ini.");
  if (data.vehicleId && !vehicle)
    conflict("Kendaraan tidak aktif atau bukan dari cabang ini.");
  if (data.agentId && !agent) conflict("Agen tidak aktif.");
}

/** DRS-<branch code><YYMM><4-digit running number>, serialized per branch. */
async function nextSheetNo(tx: Tx, branchId: number, date: Date) {
  const rows = await tx.$queryRaw<{ code: string }[]>`
    SELECT code FROM branches WHERE id = ${branchId} FOR UPDATE`;
  const code =
    (rows[0]?.code ?? "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 10) || `C${branchId}`;
  const { year, month } = businessYearMonth(date);
  const prefix = `DRS-${code}${String(year).slice(2)}${String(month).padStart(2, "0")}`;
  const start = prefix.length + 1;
  const found = await tx.$queryRaw<{ max: number | null }[]>`
    SELECT max(CASE WHEN substring(sheet_no FROM ${start}::int) ~ '^[0-9]{1,9}$'
                    THEN substring(sheet_no FROM ${start}::int)::int END) AS max
    FROM delivery_sheets
    WHERE sheet_no LIKE ${`${prefix}%`}`;
  return `${prefix}${String((found[0]?.max ?? 0) + 1).padStart(4, "0")}`;
}

export async function createStandaloneDeliverySheet(
  actor: AccessActor,
  input: unknown,
) {
  assertPermission(actor, "create", "delivery");
  const data = standaloneSheetInput.parse(input);
  if (!permitsBranch(actor, data.branchId)) forbidden();
  return prisma.$transaction(async (tx) => {
    await assertResources(tx, data.branchId, data);
    const deliveryDate = businessDateStartUtc(data.deliveryDate);
    const sheetNo =
      data.sheetNo ?? (await nextSheetNo(tx, data.branchId, deliveryDate));
    return tx.deliverySheet.create({
      data: {
        sheetNo,
        deliveryDate,
        branchId: data.branchId,
        courierId: data.courierId,
        driverId: data.driverId ?? null,
        vehicleId: data.vehicleId ?? null,
        agentId: data.agentId ?? null,
        remarks: data.remarks ?? null,
        createdById: actor.id,
      },
      select: { id: true },
    });
  });
}

/** Load a standalone DRS for writing, locked, with branch access checked. */
async function writableSheet(tx: Tx, actor: AccessActor, id: number) {
  await tx.$queryRaw`SELECT id FROM delivery_sheets WHERE id = ${id} FOR UPDATE`;
  const sheet = await tx.deliverySheet.findFirst({
    where: { id, manifestId: null, deletedAt: null },
    select: { id: true, branchId: true },
  });
  if (!sheet?.branchId) throw new IdentityError("NOT_FOUND", 404);
  if (!permitsBranch(actor, sheet.branchId)) forbidden();
  return sheet;
}

/**
 * Add an AWB to a standalone DRS. The AWB must be visible to the actor, not
 * cancelled or already delivered, and not waiting on another open DRS line.
 * The AWB row lock serializes concurrent additions of the same AWB.
 */
export async function addAwbToDeliverySheet(
  actor: AccessActor,
  input: unknown,
) {
  assertPermission(actor, "update", "delivery");
  const data = sheetAwbInput.parse(input);
  const admin = isAdministrator(actor);
  return prisma.$transaction(async (tx) => {
    const sheet = await writableSheet(tx, actor, data.deliverySheetId);
    const matches = await tx.transaction.findMany({
      where: {
        awbNo: { equals: data.awbNo, mode: "insensitive" },
        deletedAt: null,
        ...(admin
          ? {}
          : {
              OR: [
                { originBranchId: { in: actor.branchIds } },
                { destinationBranchId: { in: actor.branchIds } },
              ],
            }),
      },
      select: { id: true, status: true, awbNo: true },
      take: 2,
    });
    if (matches.length > 1)
      conflict(
        "Nomor AWB ini dipakai di lebih dari satu cabang asal. Hubungi admin.",
      );
    const awb = matches[0];
    if (!awb) conflict("AWB tidak ditemukan dalam cakupan cabang Anda.");
    await tx.$queryRaw`SELECT id FROM transactions WHERE id = ${awb.id} FOR UPDATE`;
    if (awb.status === "Delivered" || awb.status === "Cancelled")
      conflict(`AWB ${awb.awbNo} berstatus ${awb.status}.`);
    const open = await tx.deliverySheetItem.findFirst({
      where: {
        transactionId: awb.id,
        deletedAt: null,
        outcome: null,
        deliverySheet: { deletedAt: null },
      },
      select: { deliverySheet: { select: { sheetNo: true } } },
    });
    if (open)
      conflict(
        `AWB ${awb.awbNo} masih menunggu hasil antar di DRS ${open.deliverySheet.sheetNo}.`,
      );
    const existing = await tx.deliverySheetItem.findUnique({
      where: {
        deliverySheetId_transactionId: {
          deliverySheetId: sheet.id,
          transactionId: awb.id,
        },
      },
      select: { id: true, deletedAt: true },
    });
    if (existing && !existing.deletedAt)
      conflict(`AWB ${awb.awbNo} sudah ada di DRS ini.`);
    // A line removed earlier is restored, since (sheet, AWB) is unique.
    const line = await (existing
      ? tx.deliverySheetItem.update({
          where: { id: existing.id },
          data: {
            deletedAt: null,
            outcome: null,
            receivedBy: null,
            notes: null,
            deliveredAt: null,
          },
          select: { id: true },
        })
      : tx.deliverySheetItem.create({
          data: { deliverySheetId: sheet.id, transactionId: awb.id },
          select: { id: true },
        }));
    await enqueueWhatsApp(tx, ["DELIVERY_SHEET"], awb.id, {
      branchId: sheet.branchId,
      payload: { deliverySheetId: sheet.id },
    });
    return line;
  });
}

/** Remove an AWB whose outcome is not recorded yet (soft deletion). */
export async function removeAwbFromDeliverySheet(
  actor: AccessActor,
  input: unknown,
) {
  assertPermission(actor, "update", "delivery");
  const data = sheetLineInput.parse(input);
  return prisma.$transaction(async (tx) => {
    const sheet = await writableSheet(tx, actor, data.deliverySheetId);
    const removed = await tx.deliverySheetItem.updateMany({
      where: {
        deliverySheetId: sheet.id,
        transactionId: data.transactionId,
        deletedAt: null,
        outcome: null,
      },
      data: { deletedAt: new Date() },
    });
    if (removed.count !== 1)
      conflict("Hanya AWB yang belum punya hasil antar yang bisa dihapus.");
    return { id: sheet.id };
  });
}

/**
 * Delete a standalone DRS (provider OBSERVED: admin can delete a DRS) when
 * no line has an outcome yet; the sheet and its lines are soft deleted.
 */
export async function deleteStandaloneDeliverySheet(
  actor: AccessActor,
  input: unknown,
) {
  assertPermission(actor, "update", "delivery");
  const { deliverySheetId } = z
    .strictObject({ deliverySheetId: z.coerce.number().int().positive() })
    .parse(input);
  return prisma.$transaction(async (tx) => {
    const sheet = await writableSheet(tx, actor, deliverySheetId);
    const recorded = await tx.deliverySheetItem.count({
      where: {
        deliverySheetId: sheet.id,
        deletedAt: null,
        outcome: { not: null },
      },
    });
    if (recorded)
      conflict("DRS yang sudah punya hasil antar tidak bisa dihapus.");
    const now = new Date();
    await tx.deliverySheetItem.updateMany({
      where: { deliverySheetId: sheet.id, deletedAt: null },
      data: { deletedAt: now },
    });
    await tx.deliverySheet.update({
      where: { id: sheet.id },
      data: { deletedAt: now },
    });
    return { id: sheet.id };
  });
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

function sheetScope(
  actor: AccessActor,
  branchId?: number,
): Prisma.DeliverySheetWhereInput {
  if (branchId !== undefined) {
    if (!permitsBranch(actor, branchId)) forbidden();
    return { manifestId: null, deletedAt: null, branchId };
  }
  return {
    manifestId: null,
    deletedAt: null,
    ...(isAdministrator(actor) ? {} : { branchId: { in: actor.branchIds } }),
  };
}

export const sheetListFilters = z.object({
  search: z.string().trim().max(50).optional().catch(undefined),
  from: z.iso.date().optional().catch(undefined),
  to: z.iso.date().optional().catch(undefined),
  branchId: z.coerce.number().int().positive().optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
});

const PAGE_SIZE = 25;

export async function listStandaloneDeliverySheets(
  actor: AccessActor,
  raw: Record<string, unknown>,
) {
  assertPermission(actor, "view", "delivery");
  const f = sheetListFilters.parse(raw);
  const today = businessDateString();
  const from = f.from ?? `${today.slice(0, 8)}01`;
  const to = f.to ?? today;
  const end = businessDateStartUtc(to);
  end.setUTCDate(end.getUTCDate() + 1);
  const where: Prisma.DeliverySheetWhereInput = {
    ...sheetScope(actor, f.branchId),
    deliveryDate: { gte: businessDateStartUtc(from), lt: end },
    ...(f.search
      ? {
          OR: [
            { sheetNo: { contains: f.search, mode: "insensitive" } },
            {
              items: {
                some: {
                  deletedAt: null,
                  transaction: {
                    awbNo: { equals: f.search, mode: "insensitive" },
                  },
                },
              },
            },
          ],
        }
      : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.deliverySheet.count({ where }),
    prisma.deliverySheet.findMany({
      where,
      orderBy: [{ deliveryDate: "desc" }, { id: "desc" }],
      skip: (f.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        sheetNo: true,
        deliveryDate: true,
        remarks: true,
        branch: { select: { name: true } },
        courier: { select: { name: true } },
        driver: { select: { name: true } },
        vehicle: { select: { licensePlate: true } },
        agent: { select: { name: true } },
        items: {
          where: { deletedAt: null },
          select: {
            outcome: true,
            transaction: { select: { koli: true, kilo: true, volume: true } },
          },
        },
      },
    }),
  ]);
  return {
    filters: { ...f, from, to },
    total,
    pageSize: PAGE_SIZE,
    rows: rows.map((row) => ({
      id: row.id,
      sheetNo: row.sheetNo,
      date: businessDateString(row.deliveryDate),
      branch: row.branch?.name ?? null,
      courier: row.courier?.name ?? null,
      driver: row.driver?.name ?? null,
      vehicle: row.vehicle?.licensePlate ?? null,
      agent: row.agent?.name ?? null,
      remarks: row.remarks,
      ...sheetTotals(row.items),
    })),
  };
}

function sheetTotals(
  items: {
    outcome: string | null;
    transaction: {
      koli: number | null;
      kilo: { toString(): string } | null;
      volume: { toString(): string } | null;
    };
  }[],
) {
  // Display totals only (weights are not money); 3-decimal rounding.
  const sum = (pick: (t: (typeof items)[number]["transaction"]) => unknown) =>
    Math.round(
      items.reduce((n, i) => n + Number(pick(i.transaction) ?? 0), 0) * 1000,
    ) / 1000;
  return {
    awb: items.length,
    koli: sum((t) => t.koli),
    kilo: sum((t) => t.kilo?.toString()),
    volume: sum((t) => t.volume?.toString()),
    done: items.filter((i) => i.outcome && FINAL.includes(i.outcome)).length,
  };
}

/** A visible standalone DRS with its lines, or null. */
export async function getStandaloneDeliverySheet(
  actor: AccessActor,
  id: number,
) {
  assertPermission(actor, "view", "delivery");
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  const sheet = await prisma.deliverySheet.findFirst({
    where: { id, ...sheetScope(actor) },
    select: {
      id: true,
      sheetNo: true,
      deliveryDate: true,
      remarks: true,
      branchId: true,
      branch: { select: { name: true } },
      courier: { select: { name: true } },
      driver: { select: { name: true } },
      vehicle: { select: { licensePlate: true, name: true } },
      agent: { select: { name: true } },
      createdBy: { select: { name: true } },
      items: {
        where: { deletedAt: null },
        orderBy: { id: "asc" },
        select: {
          id: true,
          transactionId: true,
          outcome: true,
          receivedBy: true,
          deliveredAt: true,
          notes: true,
          transaction: {
            select: {
              awbNo: true,
              status: true,
              receiverName: true,
              receiverAddress: true,
              receiverPhone: true,
              koli: true,
              kilo: true,
              volume: true,
              codValue: true,
              destinationBranch: { select: { name: true } },
            },
          },
        },
      },
    },
  });
  if (!sheet) return null;
  return {
    ...sheet,
    date: businessDateString(sheet.deliveryDate),
    totals: sheetTotals(sheet.items),
  };
}

/** Branch, courier, driver, vehicle and agent choices for the create form. */
export async function deliverySheetFormOptions(actor: AccessActor) {
  const admin = isAdministrator(actor);
  const branchFilter = admin ? {} : { id: { in: actor.branchIds } };
  const inScope = admin
    ? {}
    : { OR: [{ branchId: null }, { branchId: { in: actor.branchIds } }] };
  const usable = { deletedAt: null, status: "ACTIVE" as const };
  const [branches, couriers, drivers, vehicles, agents] = await Promise.all([
    prisma.branch.findMany({
      where: { deletedAt: null, ...branchFilter },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.courier.findMany({
      where: { ...usable, ...inScope },
      select: { id: true, name: true, branchId: true },
      orderBy: { name: "asc" },
    }),
    prisma.driver.findMany({
      where: { ...usable, ...inScope },
      select: { id: true, name: true, branchId: true },
      orderBy: { name: "asc" },
    }),
    prisma.vehicle.findMany({
      where: { ...usable, ...inScope },
      select: { id: true, licensePlate: true, name: true, branchId: true },
      orderBy: { licensePlate: "asc" },
    }),
    prisma.agent.findMany({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        ...(admin ? {} : { branchId: { in: actor.branchIds } }),
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return { branches, couriers, drivers, vehicles, agents };
}
