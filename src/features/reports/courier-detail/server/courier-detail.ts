import "server-only";

import { z } from "zod";
import {
  type AccessActor,
  isAdministrator,
  permitsBranch,
} from "@/features/identity/permissions";
import { assertPermission } from "@/features/identity/server/access";
import {
  businessDateStartUtc,
  businessDateString,
  businessDateTimeString,
} from "@/lib/date/business-date";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/db/generated/client";

/**
 * Laporan Detail Kurir (Laporan-laporan > Laporan Kurir). Provider OBSERVED
 * filters: Periode, Branch, Kurir, Status; totals Sukses / Pending / Failed;
 * columns DRS No., AWB No, Kurir, Tanggal, Asal, Tujuan, Pengirim, Layanan,
 * Status, Penerima, Diterima Oleh, Tgl. Diterima, Acc. in, L.Time, SLA.
 * Simplified per D-35: one row per DRS line (manifest DRS and standalone),
 * L.Time = the AWB Lead Time; Acc. in and SLA are not shown yet.
 * Status: no outcome = Pending, Terkirim = Sukses, Gagal / Retur = Failed.
 */
export const COURIER_STATUS = {
  SUCCESS: "Sukses",
  PENDING: "Pending",
  FAILED: "Failed",
} as const;

const filters = z.object({
  from: z.iso.date().optional().catch(undefined),
  to: z.iso.date().optional().catch(undefined),
  branchId: z.coerce.number().int().positive().optional().catch(undefined),
  courierId: z.coerce.number().int().positive().optional().catch(undefined),
  status: z.enum(["SUCCESS", "PENDING", "FAILED"]).optional().catch(undefined),
});

const LIMIT = 2000;

function outcomeWhere(
  status: "SUCCESS" | "PENDING" | "FAILED",
): Prisma.DeliverySheetItemWhereInput {
  if (status === "SUCCESS") return { outcome: "DELIVERED" };
  if (status === "PENDING") return { outcome: null };
  return { outcome: { in: ["FAILED_DELIVERY", "RETURNED"] } };
}

function statusOf(outcome: string | null) {
  if (!outcome) return COURIER_STATUS.PENDING;
  return outcome === "DELIVERED"
    ? COURIER_STATUS.SUCCESS
    : COURIER_STATUS.FAILED;
}

export async function courierDetailReport(
  actor: AccessActor,
  raw: Record<string, unknown>,
) {
  assertPermission(actor, "view", "delivery_report");
  const f = filters.parse(raw);
  const today = businessDateString();
  const from = f.from ?? today;
  const to = f.to ?? today;
  const end = businessDateStartUtc(to);
  end.setUTCDate(end.getUTCDate() + 1);
  const admin = isAdministrator(actor);
  const branchIds =
    f.branchId !== undefined
      ? permitsBranch(actor, f.branchId)
        ? [f.branchId]
        : []
      : admin
        ? null
        : actor.branchIds;
  // A DRS belongs to its manifest's branch, or to its own branch when it is
  // standalone (Kurir Kota).
  const sheetWhere: Prisma.DeliverySheetWhereInput = {
    deletedAt: null,
    deliveryDate: { gte: businessDateStartUtc(from), lt: end },
    ...(branchIds === null
      ? { OR: [{ manifest: { deletedAt: null } }, { manifestId: null }] }
      : {
          OR: [
            { manifest: { deletedAt: null, branchId: { in: branchIds } } },
            { manifestId: null, branchId: { in: branchIds } },
          ],
        }),
    ...(f.courierId !== undefined
      ? {
          AND: [
            {
              OR: [
                { courierId: f.courierId },
                { courierId: null, manifest: { courierId: f.courierId } },
              ],
            },
          ],
        }
      : {}),
  };
  const base: Prisma.DeliverySheetItemWhereInput = {
    deletedAt: null,
    transaction: { deletedAt: null },
    deliverySheet: sheetWhere,
  };
  const [rows, success, pending, failed] = await Promise.all([
    prisma.deliverySheetItem.findMany({
      where: { ...base, ...(f.status ? outcomeWhere(f.status) : {}) },
      orderBy: [{ deliverySheet: { deliveryDate: "desc" } }, { id: "desc" }],
      take: LIMIT,
      select: {
        id: true,
        outcome: true,
        receivedBy: true,
        deliveredAt: true,
        transactionId: true,
        deliverySheet: {
          select: {
            sheetNo: true,
            deliveryDate: true,
            courier: { select: { name: true } },
            manifest: { select: { courier: { select: { name: true } } } },
          },
        },
        transaction: {
          select: {
            awbNo: true,
            senderName: true,
            receiverName: true,
            leadTime: true,
            originBranch: { select: { name: true } },
            destinationBranch: { select: { name: true } },
            deliveryService: { select: { name: true } },
          },
        },
      },
    }),
    prisma.deliverySheetItem.count({
      where: { ...base, ...outcomeWhere("SUCCESS") },
    }),
    prisma.deliverySheetItem.count({
      where: { ...base, ...outcomeWhere("PENDING") },
    }),
    prisma.deliverySheetItem.count({
      where: { ...base, ...outcomeWhere("FAILED") },
    }),
  ]);
  return {
    filters: { ...f, from, to },
    totals: { success, pending, failed },
    truncated: rows.length >= LIMIT,
    rows: rows.map((row) => ({
      id: row.id,
      transactionId: row.transactionId,
      sheetNo: row.deliverySheet.sheetNo,
      awbNo: row.transaction.awbNo,
      courier:
        (row.deliverySheet.courier ?? row.deliverySheet.manifest?.courier)
          ?.name ?? null,
      date: businessDateString(row.deliverySheet.deliveryDate),
      origin: row.transaction.originBranch?.name ?? null,
      destination: row.transaction.destinationBranch?.name ?? null,
      sender: row.transaction.senderName,
      service: row.transaction.deliveryService?.name ?? null,
      status: statusOf(row.outcome),
      receiver: row.transaction.receiverName,
      receivedBy: row.receivedBy,
      receivedAt: businessDateTimeString(row.deliveredAt) || null,
      leadTime: row.transaction.leadTime,
    })),
  };
}

/** Branch and courier choices limited to the actor's scope. */
export async function courierDetailOptions(actor: AccessActor) {
  const admin = isAdministrator(actor);
  const [branches, couriers] = await Promise.all([
    prisma.branch.findMany({
      where: {
        deletedAt: null,
        ...(admin ? {} : { id: { in: actor.branchIds } }),
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.courier.findMany({
      where: {
        deletedAt: null,
        ...(admin
          ? {}
          : {
              OR: [{ branchId: null }, { branchId: { in: actor.branchIds } }],
            }),
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 1000,
    }),
  ]);
  return { branches, couriers };
}
