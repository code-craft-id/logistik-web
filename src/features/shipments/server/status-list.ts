import "server-only";

import type { AccessActor } from "@/features/identity/permissions";
import { assertPermission } from "@/features/identity/server/access";
import { transactionScope } from "@/features/modul/server/common";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/db/generated/client";

export const SHIPMENT_STATUS_PAGE_SIZE = 50;

export type ShipmentStatusRow = {
  id: number;
  awbNo: string;
  date: string;
  origin: string | null;
  destination: string | null;
  sender: string | null;
  service: string | null;
  status: string;
  receiver: string | null;
  receivedBy: string | null;
  receivedAt: string | null;
  leadTimeDays: number | null;
  /**
   * Provider SLA column: "In Progress" until received (OBSERVED). On-time /
   * late after receipt needs an approved ETA rule, so "Selesai" for now.
   */
  sla: string;
};

const day = (d: Date) =>
  Date.parse(`${d.toISOString().slice(0, 10)}T00:00:00Z`);

/**
 * Kelola Status Pengiriman (provider "Status Pengantaran" / Quick Action
 * "Shipment Status"): AWBs of the actor's branches with their delivery
 * state, newest first.
 */
export async function listShipmentStatus(
  actor: AccessActor,
  params: { search?: string; status?: string; page?: number },
) {
  assertPermission(actor, "view", "transaction");
  const search = (params.search ?? "").trim().slice(0, 60);
  const status = (params.status ?? "").trim().slice(0, 30);
  const page = Math.min(Math.max(1, Math.trunc(params.page ?? 1)), 10_000);
  const where: Prisma.TransactionWhereInput = {
    deletedAt: null,
    AND: [
      transactionScope(actor),
      search
        ? {
            OR: [
              { awbNo: { contains: search, mode: "insensitive" } },
              { doNo: { contains: search, mode: "insensitive" } },
              { senderName: { contains: search, mode: "insensitive" } },
              { receiverName: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      status ? { status } : {},
    ],
  };
  const [total, rows, statuses] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
      skip: (page - 1) * SHIPMENT_STATUS_PAGE_SIZE,
      take: SHIPMENT_STATUS_PAGE_SIZE,
      select: {
        id: true,
        awbNo: true,
        transactionDate: true,
        senderName: true,
        receiverName: true,
        status: true,
        originBranch: { select: { name: true } },
        destinationBranch: { select: { name: true } },
        deliveryService: { select: { name: true } },
        deliveryProofs: {
          where: { deletedAt: null, outcome: "DELIVERED" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { receiverName: true, createdAt: true },
        },
        deliverySheetItems: {
          where: { deletedAt: null, deliveredAt: { not: null } },
          orderBy: { deliveredAt: "desc" },
          take: 1,
          select: { receivedBy: true, deliveredAt: true },
        },
      },
    }),
    prisma.transaction.findMany({
      where: { deletedAt: null, ...transactionScope(actor) },
      distinct: ["status"],
      select: { status: true },
      orderBy: { status: "asc" },
      take: 50,
    }),
  ]);
  return {
    total,
    page,
    pages: Math.max(1, Math.ceil(total / SHIPMENT_STATUS_PAGE_SIZE)),
    statuses: statuses.map((s) => s.status),
    rows: rows.map((t): ShipmentStatusRow => {
      const proof = t.deliveryProofs[0];
      const drs = t.deliverySheetItems[0];
      const receivedAt = proof?.createdAt ?? drs?.deliveredAt ?? null;
      return {
        id: t.id,
        awbNo: t.awbNo ?? `#${t.id}`,
        date: t.transactionDate.toISOString().slice(0, 10),
        origin: t.originBranch?.name ?? null,
        destination: t.destinationBranch?.name ?? null,
        sender: t.senderName,
        service: t.deliveryService?.name ?? null,
        status: t.status,
        receiver: t.receiverName,
        receivedBy: proof?.receiverName ?? drs?.receivedBy ?? null,
        receivedAt: receivedAt?.toISOString() ?? null,
        leadTimeDays: receivedAt
          ? Math.max(
              0,
              Math.round(
                (day(receivedAt) - day(t.transactionDate)) / 86_400_000,
              ),
            )
          : null,
        sla: receivedAt || t.status === "Delivered" ? "Selesai" : "In Progress",
      };
    }),
  };
}
