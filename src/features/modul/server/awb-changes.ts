import "server-only";

import { z } from "zod";
import {
  type AccessActor,
  isAdministrator,
} from "@/features/identity/permissions";
import { assertPermission } from "@/features/identity/server/access";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/db/generated/client";
import {
  dayEnd,
  dayStart,
  lockRow,
  ModulError,
  transactionScope,
} from "./common";

export const AWB_CHANGE_KINDS = { EDIT: "Edit", DELETE: "Hapus" } as const;
export const AWB_CHANGE_STATUS = {
  PENDING: "Menunggu",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  USED: "Sudah diedit",
} as const;

const requestSchema = z.object({
  transactionId: z.coerce.number().int().positive(),
  kind: z.enum(["EDIT", "DELETE"]),
  reason: z.string().trim().min(5, "Alasan minimal 5 karakter.").max(500),
});

export async function requestAwbChange(actor: AccessActor, input: unknown) {
  assertPermission(actor, "request", "awb_change");
  const data = requestSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    await lockRow(tx, "transactions", data.transactionId);
    const awb = await tx.transaction.findFirst({
      where: {
        id: data.transactionId,
        deletedAt: null,
        ...transactionScope(actor),
      },
      select: { id: true },
    });
    if (!awb)
      throw new ModulError("AWB tidak ditemukan atau di luar cabang Anda.");
    const open = await tx.awbChangeRequest.findFirst({
      where: {
        transactionId: awb.id,
        kind: data.kind,
        status: { in: ["PENDING", "APPROVED"] },
      },
      select: { status: true },
    });
    if (open)
      throw new ModulError(
        open.status === "PENDING"
          ? "Sudah ada pengajuan yang sama dan masih menunggu persetujuan."
          : "Pengajuan edit sebelumnya sudah disetujui dan belum dipakai. Lakukan edit terlebih dahulu.",
      );
    return tx.awbChangeRequest.create({
      data: { ...data, requestedById: actor.id },
      select: { id: true },
    });
  });
}

/** Records that keep an AWB from being deleted, as user-facing text. */
async function deleteBlockers(
  tx: Prisma.TransactionClient,
  transactionId: number,
) {
  const [manifest, delivery, invoice, ledger, pod, bill] = await Promise.all([
    tx.manifestItem.count({
      where: { transactionId, deletedAt: null, releasedAt: null },
    }),
    tx.deliverySheetItem.count({ where: { transactionId, deletedAt: null } }),
    tx.finInvoiceItem.count({ where: { transactionId } }),
    tx.finLine.count({ where: { transactionId } }),
    tx.podReturnItem.count({
      where: {
        transactionId,
        podReturn: { deletedAt: null, status: { not: "REJECTED" } },
      },
    }),
    tx.vendorBillItem.count({
      where: { transactionId, vendorBill: { deletedAt: null } },
    }),
  ]);
  return [
    manifest && "manifest aktif",
    delivery && "lembar pengantaran",
    invoice && "invoice",
    ledger && "jurnal",
    pod && "POD Kembali",
    bill && "pembayaran hutang",
  ].filter(Boolean) as string[];
}

const decideSchema = z.object({
  id: z.coerce.number().int().positive(),
  decision: z.enum(["APPROVE", "REJECT"]),
  note: z.string().trim().max(500).optional(),
});

export async function decideAwbChange(actor: AccessActor, input: unknown) {
  assertPermission(actor, "approve", "awb_change");
  const data = decideSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    await lockRow(tx, "awb_change_requests", data.id);
    const request = await tx.awbChangeRequest.findFirst({
      where: { id: data.id, transaction: transactionScope(actor) },
      select: {
        id: true,
        kind: true,
        status: true,
        requestedById: true,
        transactionId: true,
      },
    });
    if (!request)
      throw new ModulError(
        "Pengajuan tidak ditemukan atau di luar cabang Anda.",
      );
    if (request.status !== "PENDING")
      throw new ModulError("Pengajuan ini sudah diputuskan sebelumnya.");
    if (request.requestedById === actor.id && !isAdministrator(actor))
      throw new ModulError(
        "Pengajuan tidak boleh disetujui oleh pengaju sendiri.",
      );
    const now = new Date();
    if (data.decision === "APPROVE" && request.kind === "DELETE") {
      await lockRow(tx, "transactions", request.transactionId);
      const blockers = await deleteBlockers(tx, request.transactionId);
      if (blockers.length)
        throw new ModulError(
          `AWB tidak bisa dihapus karena masih dipakai di ${blockers.join(", ")}. Lepaskan dulu dari dokumen tersebut.`,
        );
      const deleted = await tx.transaction.updateMany({
        where: { id: request.transactionId, deletedAt: null },
        data: { deletedAt: now },
      });
      if (deleted.count !== 1)
        throw new ModulError("AWB sudah dihapus sebelumnya.");
    }
    return tx.awbChangeRequest.update({
      where: { id: request.id },
      data: {
        status: data.decision === "APPROVE" ? "APPROVED" : "REJECTED",
        decidedById: actor.id,
        decidedAt: now,
        decisionNote: data.note || null,
      },
      select: { id: true },
    });
  });
}

const decimal = (scale: number) =>
  z
    .string()
    .trim()
    .regex(
      new RegExp(`^(0|[1-9]\\d{0,12})(\\.\\d{1,${scale}})?$`),
      "Angka tidak valid.",
    )
    .optional()
    .or(z.literal("").transform(() => undefined));
const text = (max: number) => z.string().trim().max(max).optional();
const editSchema = z.object({
  requestId: z.coerce.number().int().positive(),
  senderName: text(255),
  receiverName: text(255),
  senderAddress: text(500),
  senderPhone: text(30),
  receiverAddress: text(500),
  receiverPhone: text(30),
  doNo: text(255),
  koli: z.coerce.number().int().min(0).max(1_000_000).optional(),
  kilo: decimal(2),
  volume: decimal(3),
  biaya: decimal(2),
  description: text(500),
  remarks: text(500),
});
const MONEY_FIELDS = ["koli", "kilo", "volume", "biaya"] as const;

/** Apply an approved EDIT request once; the diff is kept on the request. */
export async function applyApprovedEdit(actor: AccessActor, input: unknown) {
  assertPermission(actor, "request", "awb_change");
  const { requestId, ...fields } = editSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    await lockRow(tx, "awb_change_requests", requestId);
    const request = await tx.awbChangeRequest.findFirst({
      where: {
        id: requestId,
        kind: "EDIT",
        transaction: { deletedAt: null, ...transactionScope(actor) },
      },
      select: { id: true, status: true, transactionId: true },
    });
    if (!request)
      throw new ModulError(
        "Pengajuan edit tidak ditemukan atau di luar cabang Anda.",
      );
    if (request.status !== "APPROVED")
      throw new ModulError(
        "Edit hanya bisa dilakukan setelah pengajuan disetujui, dan hanya sekali.",
      );
    await lockRow(tx, "transactions", request.transactionId);
    const current = await tx.transaction.findUniqueOrThrow({
      where: { id: request.transactionId },
      select: {
        senderName: true,
        senderAddress: true,
        senderPhone: true,
        receiverAddress: true,
        receiverPhone: true,
        receiverName: true,
        doNo: true,
        koli: true,
        kilo: true,
        volume: true,
        biaya: true,
        description: true,
        remarks: true,
      },
    });
    const changes: Record<string, [string | null, string | null]> = {};
    const update: Prisma.TransactionUpdateInput = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined) continue;
      const before = current[key as keyof typeof current];
      const beforeText = before === null ? null : String(before);
      const afterText = String(value);
      const same =
        before instanceof Prisma.Decimal
          ? before.equals(new Prisma.Decimal(afterText))
          : beforeText === afterText;
      if (same) continue;
      changes[key] = [beforeText, afterText];
      (update as Record<string, unknown>)[key] = value;
    }
    if (!Object.keys(changes).length)
      throw new ModulError("Tidak ada data yang berubah.");
    if (MONEY_FIELDS.some((f) => f in changes)) {
      const [invoice, ledger] = await Promise.all([
        tx.finInvoiceItem.count({
          where: { transactionId: request.transactionId },
        }),
        tx.finLine.count({ where: { transactionId: request.transactionId } }),
      ]);
      if (invoice || ledger)
        throw new ModulError(
          "Koli, berat, volume dan biaya tidak bisa diubah karena AWB sudah masuk invoice atau jurnal.",
        );
    }
    await tx.transaction.update({
      where: { id: request.transactionId },
      data: update,
    });
    await tx.awbChangeRequest.update({
      where: { id: request.id },
      data: { status: "USED", usedAt: new Date(), changes },
    });
    return { id: request.transactionId };
  });
}

export async function listAwbChanges(
  actor: AccessActor,
  params: { status?: string; search?: string; from?: string; to?: string } = {},
) {
  assertPermission(actor, "view", "awb_change");
  const status =
    params.status && params.status in AWB_CHANGE_STATUS
      ? params.status
      : undefined;
  const search = params.search?.trim().slice(0, 50);
  const from = dayStart(params.from);
  const to = dayEnd(params.to);
  const rows = await prisma.awbChangeRequest.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lt: to } : {}),
            },
          }
        : {}),
      transaction: {
        ...transactionScope(actor),
        ...(search
          ? { awbNo: { contains: search, mode: "insensitive" as const } }
          : {}),
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 200,
    select: {
      id: true,
      kind: true,
      reason: true,
      status: true,
      changes: true,
      createdAt: true,
      decidedAt: true,
      decisionNote: true,
      requestedById: true,
      transaction: { select: { id: true, awbNo: true } },
      requestedBy: { select: { name: true } },
      decidedBy: { select: { name: true } },
    },
  });
  return rows;
}

/** Requests for one AWB (detail page). */
export async function awbChangesFor(actor: AccessActor, transactionId: number) {
  if (!actor) return [];
  return prisma.awbChangeRequest.findMany({
    where: { transactionId, transaction: transactionScope(actor) },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      kind: true,
      status: true,
      reason: true,
      createdAt: true,
      decisionNote: true,
      changes: true,
      usedAt: true,
      requestedBy: { select: { name: true } },
      decidedBy: { select: { name: true } },
    },
  });
}
