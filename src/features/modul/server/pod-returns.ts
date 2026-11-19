import "server-only";

import { z } from "zod";
import {
  type AccessActor,
  isAdministrator,
  permitsBranch,
} from "@/features/identity/permissions";
import { assertPermission } from "@/features/identity/server/access";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/db/generated/client";
import { dayEnd, dayStart, lockKey, lockRow, ModulError } from "./common";

export const POD_RETURN_STATUS = {
  PENDING: "Menunggu",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
} as const;

function visible(actor: AccessActor): Prisma.PodReturnWhereInput {
  if (isAdministrator(actor)) return { deletedAt: null };
  return {
    deletedAt: null,
    OR: [
      { originBranchId: { in: actor.branchIds } },
      { destinationBranchId: { in: actor.branchIds } },
    ],
  };
}

/** Split pasted AWB numbers on commas, spaces or new lines. */
export function parseAwbList(raw: string) {
  return [
    ...new Set(
      raw
        .split(/[\s,;]+/)
        .map((v) => v.trim())
        .filter(Boolean),
    ),
  ];
}

const createSchema = z.object({
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  originBranchId: z.coerce.number().int().positive(),
  destinationBranchId: z.coerce.number().int().positive(),
  driverId: z.coerce.number().int().positive().optional(),
  notes: z.string().trim().max(500).optional(),
  awbs: z.string().trim().min(1, "Isi minimal satu nomor AWB.").max(20000),
});

/**
 * POD Kembali: the delivering branch (origin of this document) sends proof
 * of delivery for delivered AWBs back to another branch. Each AWB may be in
 * only one document that is not rejected.
 */
export async function createPodReturn(actor: AccessActor, input: unknown) {
  assertPermission(actor, "create", "pod_return");
  const data = createSchema.parse(input);
  if (!permitsBranch(actor, data.originBranchId))
    throw new ModulError("Cabang asal harus cabang Anda.");
  if (data.originBranchId === data.destinationBranchId)
    throw new ModulError("Cabang tujuan harus berbeda dengan cabang asal.");
  const awbNos = parseAwbList(data.awbs);
  if (awbNos.length > 300)
    throw new ModulError("Maksimal 300 AWB per dokumen.");
  return prisma.$transaction(async (tx) => {
    const [destination, driver] = await Promise.all([
      tx.branch.count({
        where: { id: data.destinationBranchId, deletedAt: null },
      }),
      data.driverId
        ? tx.driver.count({ where: { id: data.driverId, deletedAt: null } })
        : 1,
    ]);
    if (!destination) throw new ModulError("Cabang tujuan tidak ditemukan.");
    if (!driver) throw new ModulError("Driver tidak ditemukan.");
    const found = await tx.transaction.findMany({
      where: {
        awbNo: { in: awbNos },
        deletedAt: null,
        OR: [
          { originBranchId: data.originBranchId },
          { destinationBranchId: data.originBranchId },
        ],
      },
      select: { id: true, awbNo: true, status: true },
    });
    const byNo = new Map<string, typeof found>();
    for (const row of found)
      byNo.set(row.awbNo ?? "", [...(byNo.get(row.awbNo ?? "") ?? []), row]);
    const missing = awbNos.filter((no) => !byNo.has(no));
    if (missing.length)
      throw new ModulError(
        `AWB tidak ditemukan di cabang asal: ${missing.slice(0, 10).join(", ")}.`,
      );
    const ambiguous = awbNos.filter((no) => (byNo.get(no)?.length ?? 0) > 1);
    if (ambiguous.length)
      throw new ModulError(
        `Nomor AWB dipakai lebih dari satu cabang: ${ambiguous.slice(0, 10).join(", ")}.`,
      );
    const notDelivered = found.filter((row) => row.status !== "Delivered");
    if (notDelivered.length)
      throw new ModulError(
        `Hanya AWB berstatus Delivered yang bisa masuk POD Kembali: ${notDelivered
          .slice(0, 10)
          .map((r) => r.awbNo)
          .join(", ")}.`,
      );
    // Lock in id order so two concurrent documents cannot deadlock.
    for (const row of [...found].sort((a, b) => a.id - b.id))
      await lockRow(tx, "transactions", row.id);
    const taken = await tx.podReturnItem.findMany({
      where: {
        transactionId: { in: found.map((r) => r.id) },
        podReturn: { deletedAt: null, status: { not: "REJECTED" } },
      },
      select: { transaction: { select: { awbNo: true } } },
    });
    if (taken.length)
      throw new ModulError(
        `AWB sudah ada di POD Kembali lain: ${taken
          .slice(0, 10)
          .map((r) => r.transaction.awbNo)
          .join(", ")}.`,
      );
    const date = new Date(`${data.returnDate}T00:00:00.000Z`);
    await lockKey(tx, `pod-return-no:${data.returnDate}`);
    const count = await tx.podReturn.count({
      where: { returnDate: { gte: date, lt: dayEnd(data.returnDate) } },
    });
    const returnNo = `POD-${data.returnDate.replaceAll("-", "")}-${String(count + 1).padStart(4, "0")}`;
    return tx.podReturn.create({
      data: {
        returnNo,
        returnDate: date,
        originBranchId: data.originBranchId,
        destinationBranchId: data.destinationBranchId,
        driverId: data.driverId ?? null,
        notes: data.notes || null,
        createdById: actor.id,
        items: { create: found.map((row) => ({ transactionId: row.id })) },
      },
      select: { id: true, returnNo: true },
    });
  });
}

const decideSchema = z.object({
  id: z.coerce.number().int().positive(),
  decision: z.enum(["APPROVE", "REJECT"]),
});

/** The receiving (destination) branch approves or rejects the document. */
export async function decidePodReturn(actor: AccessActor, input: unknown) {
  assertPermission(actor, "approve", "pod_return");
  const data = decideSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    await lockRow(tx, "pod_returns", data.id);
    const doc = await tx.podReturn.findFirst({
      where: { id: data.id, deletedAt: null },
      select: { id: true, status: true, destinationBranchId: true },
    });
    if (!doc || !permitsBranch(actor, doc.destinationBranchId))
      throw new ModulError(
        "Dokumen tidak ditemukan, atau hanya cabang tujuan yang boleh menyetujui.",
      );
    if (doc.status !== "PENDING")
      throw new ModulError("Dokumen ini sudah diputuskan sebelumnya.");
    return tx.podReturn.update({
      where: { id: doc.id },
      data: {
        status: data.decision === "APPROVE" ? "APPROVED" : "REJECTED",
        decidedById: actor.id,
        decidedAt: new Date(),
      },
      select: { id: true },
    });
  });
}

export async function listPodReturns(
  actor: AccessActor,
  params: { status?: string; search?: string; from?: string; to?: string } = {},
) {
  assertPermission(actor, "view", "pod_return");
  const status =
    params.status && params.status in POD_RETURN_STATUS
      ? params.status
      : undefined;
  const search = params.search?.trim().slice(0, 50);
  const from = dayStart(params.from);
  const to = dayEnd(params.to);
  const rows = await prisma.podReturn.findMany({
    where: {
      ...visible(actor),
      ...(status ? { status } : {}),
      ...(search
        ? { returnNo: { contains: search, mode: "insensitive" as const } }
        : {}),
      ...(from || to
        ? {
            returnDate: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lt: to } : {}),
            },
          }
        : {}),
    },
    orderBy: [{ returnDate: "desc" }, { id: "desc" }],
    take: 200,
    select: {
      id: true,
      returnNo: true,
      returnDate: true,
      notes: true,
      status: true,
      destinationBranchId: true,
      originBranch: { select: { name: true } },
      destinationBranch: { select: { name: true } },
      driver: { select: { name: true } },
      createdBy: { select: { name: true } },
      decidedBy: { select: { name: true } },
      _count: { select: { items: true } },
    },
  });
  return rows;
}

export async function getPodReturn(actor: AccessActor, id: number) {
  assertPermission(actor, "view", "pod_return");
  return prisma.podReturn.findFirst({
    where: { id, ...visible(actor) },
    select: {
      id: true,
      returnNo: true,
      returnDate: true,
      notes: true,
      status: true,
      decidedAt: true,
      destinationBranchId: true,
      originBranch: { select: { name: true } },
      destinationBranch: { select: { name: true } },
      driver: { select: { name: true } },
      createdBy: { select: { name: true } },
      decidedBy: { select: { name: true } },
      items: {
        orderBy: { id: "asc" },
        select: {
          transaction: {
            select: {
              id: true,
              awbNo: true,
              receiverName: true,
              koli: true,
              kilo: true,
            },
          },
        },
      },
    },
  });
}
