import "server-only";

import { z } from "zod";
import {
  type AccessActor,
  isAdministrator,
  permitsBranch,
} from "@/features/identity/permissions";
import { assertPermission } from "@/features/identity/server/access";
import { ModulError } from "@/features/modul/server/common";
import {
  businessDateStartUtc,
  businessDateString,
} from "@/lib/date/business-date";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/db/generated/client";

/**
 * Share Truck (D-43; sandbox menu OBSERVED 2026-11-24). One company:
 * - Ready Truck: share an own vehicle on a route, period and price;
 * - Dashboard: search shared trucks (cheapest / fastest) and create an
 *   Order Masuk for a customer;
 * - Order Masuk (IN): WAITING until accepted or rejected;
 * - Order Keluar (OUT): we charter a vendor truck, starts ACCEPTED;
 * - Update Status: ACCEPTED -> LOADING -> ON THE WAY -> ARRIVED -> DONE,
 *   every change logged (Cek Status);
 * - Invoice Keluar (IN) / Invoice Masuk (OUT): one per order, amount =
 *   Total Biaya, UNPAID -> PAID. No journal is posted.
 */
export const CHARTER_STATUS = [
  "WAITING",
  "ACCEPTED",
  "LOADING",
  "ON THE WAY",
  "ARRIVED",
  "DONE",
  "REJECTED",
] as const;
export type CharterStatus = (typeof CHARTER_STATUS)[number];
const NEXT: Partial<Record<CharterStatus, CharterStatus>> = {
  ACCEPTED: "LOADING",
  LOADING: "ON THE WAY",
  "ON THE WAY": "ARRIVED",
  ARRIVED: "DONE",
};
export const nextCharterStatus = (s: string) =>
  NEXT[s as CharterStatus] ?? null;

const view = (actor: AccessActor) =>
  assertPermission(actor, "view", "share_truck");
const manage = (actor: AccessActor) =>
  assertPermission(actor, "manage", "share_truck");
const branchScope = (actor: AccessActor): Prisma.CharterOrderWhereInput =>
  isAdministrator(actor) ? {} : { branchId: { in: actor.branchIds } };
const vehicleScope = (actor: AccessActor): Prisma.VehicleWhereInput =>
  isAdministrator(actor)
    ? {}
    : { OR: [{ branchId: { in: actor.branchIds } }, { branchId: null }] };

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid.");
const money = z
  .string()
  .trim()
  .regex(/^\d{1,13}(\.\d{1,2})?$/, "Nilai harus angka positif.");
const text = (max: number) => z.string().trim().min(1).max(max);
const optText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || null);
const optNum = z
  .union([z.literal(""), z.coerce.number().nonnegative()])
  .optional()
  .transform((v) => (typeof v === "number" ? v : null));
/** Date-only columns (@db.Date) store the calendar day at UTC midnight. */
const date = (v: string) => {
  try {
    businessDateStartUtc(v); // validates the calendar date
  } catch {
    throw new ModulError("Tanggal tidak valid.");
  }
  return new Date(`${v}T00:00:00.000Z`);
};
const parse = <T extends z.ZodTypeAny>(schema: T, raw: unknown): z.infer<T> => {
  const r = schema.safeParse(raw);
  if (!r.success)
    throw new ModulError(r.error.issues[0]?.message ?? "Isian belum valid.");
  return r.data;
};

/* ---------- Ready Truck ---------- */

export async function readyTrucks(actor: AccessActor) {
  view(actor);
  return prisma.vehicle.findMany({
    where: { deletedAt: null, status: "ACTIVE", ...vehicleScope(actor) },
    select: {
      id: true,
      name: true,
      licensePlate: true,
      truckingType: { select: { name: true } },
      share: true,
    },
    orderBy: { licensePlate: "asc" },
    take: 500,
  });
}

const shareInput = z
  .object({
    vehicleId: z.coerce.number().int().positive(),
    origin: text(100),
    destination: text(100),
    leadTimeDays: z.coerce.number().int().min(0).max(365),
    availableFrom: ymd,
    availableTo: ymd,
    price: money,
  })
  .refine((v) => v.availableTo >= v.availableFrom, {
    message: "Tgl Berakhir tidak boleh sebelum Tgl Tersedia.",
  });

/** Share (or update the offer of) an own vehicle. */
export async function shareTruck(actor: AccessActor, raw: unknown) {
  manage(actor);
  const d = parse(shareInput, raw);
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: d.vehicleId, deletedAt: null, ...vehicleScope(actor) },
    select: { id: true },
  });
  if (!vehicle) throw new ModulError("Kendaraan tidak ditemukan.");
  const data = {
    origin: d.origin,
    destination: d.destination,
    leadTimeDays: d.leadTimeDays,
    availableFrom: date(d.availableFrom),
    availableTo: date(d.availableTo),
    price: d.price,
    active: true,
  };
  return prisma.vehicleShare.upsert({
    where: { vehicleId: vehicle.id },
    create: { vehicleId: vehicle.id, ...data },
    update: data,
    select: { id: true },
  });
}

export async function unshareTruck(actor: AccessActor, raw: unknown) {
  manage(actor);
  const { vehicleId } = parse(
    z.object({ vehicleId: z.coerce.number().int().positive() }),
    raw,
  );
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, deletedAt: null, ...vehicleScope(actor) },
    select: { id: true },
  });
  if (!vehicle) throw new ModulError("Kendaraan tidak ditemukan.");
  await prisma.vehicleShare.updateMany({
    where: { vehicleId },
    data: { active: false },
  });
}

/* ---------- Dashboard ---------- */

export async function searchSharedTrucks(
  actor: AccessActor,
  q: { type?: string; sort?: string },
) {
  view(actor);
  const today = date(businessDateString());
  const rows = await prisma.vehicleShare.findMany({
    where: {
      active: true,
      availableTo: { gte: today },
      vehicle: {
        deletedAt: null,
        status: "ACTIVE",
        ...vehicleScope(actor),
        ...(q.type ? { truckingType: { name: q.type } } : {}),
      },
    },
    select: {
      id: true,
      origin: true,
      destination: true,
      leadTimeDays: true,
      availableFrom: true,
      availableTo: true,
      price: true,
      vehicle: {
        select: {
          id: true,
          name: true,
          licensePlate: true,
          truckingType: { select: { name: true } },
          branch: { select: { name: true } },
        },
      },
    },
    orderBy:
      q.sort === "fast"
        ? [{ leadTimeDays: "asc" }, { price: "asc" }]
        : [{ price: "asc" }, { leadTimeDays: "asc" }],
    take: 200,
  });
  const types = await prisma.truckingType.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return { rows, types };
}

/* ---------- Orders ---------- */

async function nextOrderNo(
  tx: Prisma.TransactionClient,
  direction: "IN" | "OUT",
) {
  const day = businessDateString().replaceAll("-", "");
  const prefix = `CH${direction === "IN" ? "I" : "O"}${day}`;
  const [{ n }] = await tx.$queryRaw<{ n: number }[]>`
    SELECT count(*)::int AS n FROM charter_orders WHERE order_no LIKE ${`${prefix}%`}`;
  return `${prefix}${String(n + 1).padStart(4, "0")}`;
}

const orderBase = {
  branchId: z.coerce.number().int().positive(),
  loadDate: ymd,
  origin: text(100),
  destination: text(100),
  weight: optNum,
  koli: optNum,
  totalCost: money,
  goods: optText(255),
  remarks: optText(255),
};
const inInput = z.object({
  ...orderBase,
  shareId: z.coerce.number().int().positive(),
  customerId: z.coerce.number().int().positive({ message: "Pilih customer." }),
});
const outInput = z.object({
  ...orderBase,
  vendorId: z.coerce.number().int().positive({ message: "Pilih vendor." }),
  plateNumber: text(20),
  truckType: optText(100),
});

async function createOrder(
  actor: AccessActor,
  direction: "IN" | "OUT",
  data: Omit<
    Prisma.CharterOrderUncheckedCreateInput,
    "orderNo" | "direction" | "status"
  >,
) {
  if (!permitsBranch(actor, data.branchId))
    throw new ModulError("Cabang bukan milik Anda.");
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const status = direction === "IN" ? "WAITING" : "ACCEPTED";
        const order = await tx.charterOrder.create({
          data: {
            ...data,
            direction,
            status,
            orderNo: await nextOrderNo(tx, direction),
            createdById: actor.id,
          },
          select: { id: true, orderNo: true },
        });
        await tx.charterStatusLog.create({
          data: {
            orderId: order.id,
            newStatus: status,
            note: "Order dibuat",
            actorId: actor.id,
          },
        });
        return order;
      });
    } catch (e) {
      // Two users took the same daily number: retry with the next one.
      if (
        attempt < 2 &&
        e instanceof Error &&
        "code" in e &&
        (e as { code?: string }).code === "P2002"
      )
        continue;
      throw e;
    }
  }
  throw new ModulError("Nomor order bentrok. Coba simpan lagi.");
}

/** Order from the Dashboard: a customer charters our shared truck. */
export async function createIncomingOrder(actor: AccessActor, raw: unknown) {
  manage(actor);
  const d = parse(inInput, raw);
  const share = await prisma.vehicleShare.findFirst({
    where: {
      id: d.shareId,
      active: true,
      vehicle: { deletedAt: null, ...vehicleScope(actor) },
    },
    select: {
      vehicleId: true,
      vehicle: {
        select: {
          licensePlate: true,
          truckingType: { select: { name: true } },
        },
      },
    },
  });
  if (!share) throw new ModulError("Truk tidak tersedia lagi.");
  const customer = await prisma.customer.findFirst({
    where: { id: d.customerId, deletedAt: null },
    select: { id: true },
  });
  if (!customer) throw new ModulError("Customer tidak ditemukan.");
  return createOrder(actor, "IN", {
    branchId: d.branchId,
    loadDate: date(d.loadDate),
    vehicleId: share.vehicleId,
    plateNumber: share.vehicle.licensePlate,
    truckType: share.vehicle.truckingType?.name ?? null,
    customerId: customer.id,
    origin: d.origin,
    destination: d.destination,
    weight: d.weight,
    koli: d.koli,
    totalCost: d.totalCost,
    goods: d.goods,
    remarks: d.remarks,
  });
}

/** Order Keluar: we charter a vendor truck. */
export async function createOutgoingOrder(actor: AccessActor, raw: unknown) {
  manage(actor);
  const d = parse(outInput, raw);
  const vendor = await prisma.vendor.findFirst({
    where: { id: d.vendorId, deletedAt: null },
    select: { id: true },
  });
  if (!vendor) throw new ModulError("Vendor tidak ditemukan.");
  return createOrder(actor, "OUT", {
    branchId: d.branchId,
    loadDate: date(d.loadDate),
    plateNumber: d.plateNumber.toUpperCase(),
    truckType: d.truckType,
    vendorId: vendor.id,
    origin: d.origin,
    destination: d.destination,
    weight: d.weight,
    koli: d.koli,
    totalCost: d.totalCost,
    goods: d.goods,
    remarks: d.remarks,
  });
}

const listInput = z.object({
  direction: z.enum(["IN", "OUT"]).optional().catch(undefined),
  search: z.string().trim().max(60).catch(""),
  from: ymd.optional().catch(undefined),
  to: ymd.optional().catch(undefined),
  active: z.boolean().optional(),
});

export async function listOrders(actor: AccessActor, raw: unknown) {
  view(actor);
  const f = listInput.parse(raw ?? {});
  const range: Prisma.DateTimeFilter = {};
  if (f.from) range.gte = date(f.from);
  if (f.to) range.lte = date(f.to);
  const rows = await prisma.charterOrder.findMany({
    where: {
      deletedAt: null,
      ...branchScope(actor),
      ...(f.direction ? { direction: f.direction } : {}),
      ...(f.active
        ? { status: { in: ["ACCEPTED", "LOADING", "ON THE WAY", "ARRIVED"] } }
        : {}),
      ...(f.search
        ? { orderNo: { contains: f.search, mode: "insensitive" } }
        : {}),
      ...(range.gte || range.lte ? { loadDate: range } : {}),
    },
    select: {
      id: true,
      direction: true,
      orderNo: true,
      loadDate: true,
      plateNumber: true,
      truckType: true,
      origin: true,
      destination: true,
      weight: true,
      koli: true,
      totalCost: true,
      goods: true,
      remarks: true,
      status: true,
      customer: { select: { name: true } },
      vendor: { select: { name: true } },
      invoice: { select: { id: true } },
      statusLogs: {
        select: {
          id: true,
          priorStatus: true,
          newStatus: true,
          note: true,
          createdAt: true,
          actor: { select: { name: true } },
        },
        orderBy: { id: "asc" },
      },
    },
    orderBy: [{ loadDate: "desc" }, { id: "desc" }],
    take: 300,
  });
  return { filters: f, rows };
}

async function lockOrder(
  tx: Prisma.TransactionClient,
  actor: AccessActor,
  id: number,
) {
  await tx.$queryRaw`SELECT id FROM charter_orders WHERE id = ${id} FOR UPDATE`;
  const order = await tx.charterOrder.findFirst({
    where: { id, deletedAt: null, ...branchScope(actor) },
    select: { id: true, direction: true, status: true, totalCost: true },
  });
  if (!order)
    throw new ModulError("Order tidak ditemukan atau bukan cabang Anda.");
  return order;
}

async function moveStatus(
  tx: Prisma.TransactionClient,
  actor: AccessActor,
  order: { id: number; status: string },
  next: CharterStatus,
  note: string | null,
) {
  await tx.charterOrder.update({
    where: { id: order.id },
    data: { status: next },
  });
  await tx.charterStatusLog.create({
    data: {
      orderId: order.id,
      priorStatus: order.status,
      newStatus: next,
      note,
      actorId: actor.id,
    },
  });
}

/** Order Masuk: accept or reject a waiting order. */
export async function decideIncomingOrder(actor: AccessActor, raw: unknown) {
  manage(actor);
  const d = parse(
    z.object({
      orderId: z.coerce.number().int().positive(),
      decision: z.enum(["ACCEPT", "REJECT"]),
      note: optText(255),
    }),
    raw,
  );
  return prisma.$transaction(async (tx) => {
    const order = await lockOrder(tx, actor, d.orderId);
    if (order.direction !== "IN" || order.status !== "WAITING")
      throw new ModulError("Order ini sudah diputuskan.");
    await moveStatus(
      tx,
      actor,
      order,
      d.decision === "ACCEPT" ? "ACCEPTED" : "REJECTED",
      d.note,
    );
  });
}

/** Update Status: advance an accepted order one trip step. */
export async function advanceOrderStatus(actor: AccessActor, raw: unknown) {
  manage(actor);
  const d = parse(
    z.object({
      orderId: z.coerce.number().int().positive(),
      status: z.enum(CHARTER_STATUS),
      note: optText(255),
    }),
    raw,
  );
  return prisma.$transaction(async (tx) => {
    const order = await lockOrder(tx, actor, d.orderId);
    if (nextCharterStatus(order.status) !== d.status)
      throw new ModulError(
        `Status ${order.status} tidak bisa diubah ke ${d.status}. Muat ulang halaman.`,
      );
    await moveStatus(tx, actor, order, d.status, d.note);
  });
}

/* ---------- Invoices ---------- */

export async function createCharterInvoice(actor: AccessActor, raw: unknown) {
  manage(actor);
  const d = parse(
    z.object({
      orderId: z.coerce
        .number()
        .int()
        .positive({ message: "Pilih No. Order." }),
      invoiceNo: text(50),
      notes: optText(255),
    }),
    raw,
  );
  return prisma.$transaction(async (tx) => {
    const order = await lockOrder(tx, actor, d.orderId);
    if (order.status === "WAITING" || order.status === "REJECTED")
      throw new ModulError("Invoice hanya untuk order yang sudah diterima.");
    const existing = await tx.charterInvoice.findUnique({
      where: { orderId: order.id },
      select: { id: true },
    });
    if (existing) throw new ModulError("Order ini sudah punya invoice.");
    return tx.charterInvoice.create({
      data: {
        orderId: order.id,
        invoiceNo: d.invoiceNo,
        notes: d.notes,
        amount: order.totalCost,
        createdById: actor.id,
      },
      select: { id: true },
    });
  });
}

export async function payCharterInvoice(actor: AccessActor, raw: unknown) {
  manage(actor);
  const { invoiceId } = parse(
    z.object({ invoiceId: z.coerce.number().int().positive() }),
    raw,
  );
  const updated = await prisma.charterInvoice.updateMany({
    where: {
      id: invoiceId,
      deletedAt: null,
      status: "UNPAID",
      order: branchScope(actor),
    },
    data: { status: "PAID", paidAt: new Date() },
  });
  if (updated.count !== 1)
    throw new ModulError("Invoice tidak ditemukan atau sudah lunas.");
}

export async function listCharterInvoices(
  actor: AccessActor,
  direction: "IN" | "OUT",
  search = "",
  period: { from?: string; to?: string } = {},
) {
  view(actor);
  const created: Prisma.DateTimeFilter = {};
  try {
    if (period.from && /^\d{4}-\d{2}-\d{2}$/.test(period.from))
      created.gte = businessDateStartUtc(period.from);
    if (period.to && /^\d{4}-\d{2}-\d{2}$/.test(period.to))
      created.lt = new Date(
        businessDateStartUtc(period.to).getTime() + 86_400_000,
      );
  } catch {
    throw new ModulError("Tanggal tidak valid.");
  }
  const where = {
    deletedAt: null,
    direction,
    ...branchScope(actor),
    status: { notIn: ["WAITING", "REJECTED"] },
  } satisfies Prisma.CharterOrderWhereInput;
  const [invoices, uninvoiced] = await Promise.all([
    prisma.charterInvoice.findMany({
      where: {
        deletedAt: null,
        order: where,
        ...(created.gte || created.lt ? { createdAt: created } : {}),
        ...(search
          ? {
              invoiceNo: { contains: search.slice(0, 50), mode: "insensitive" },
            }
          : {}),
      },
      select: {
        id: true,
        invoiceNo: true,
        notes: true,
        amount: true,
        status: true,
        paidAt: true,
        createdAt: true,
        order: {
          select: {
            orderNo: true,
            plateNumber: true,
            customer: { select: { name: true } },
            vendor: { select: { name: true } },
          },
        },
      },
      orderBy: { id: "desc" },
      take: 300,
    }),
    prisma.charterOrder.findMany({
      where: { ...where, invoice: null },
      select: { id: true, orderNo: true, plateNumber: true, totalCost: true },
      orderBy: { id: "desc" },
      take: 300,
    }),
  ]);
  return { invoices, uninvoiced };
}

export async function charterFormChoices(actor: AccessActor) {
  const [branches, customers, vendors] = await Promise.all([
    prisma.branch.findMany({
      where: {
        deletedAt: null,
        ...(isAdministrator(actor) ? {} : { id: { in: actor.branchIds } }),
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.customer.findMany({
      where: {
        deletedAt: null,
        ...(isAdministrator(actor)
          ? {}
          : {
              OR: [{ branchId: { in: actor.branchIds } }, { branchId: null }],
            }),
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 2000,
    }),
    prisma.vendor.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return { branches, customers, vendors };
}
