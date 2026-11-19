import "server-only";

import { z } from "zod";
import { ALLOWED_TRANSITIONS } from "@/features/bookings/status";
import type { AccessActor } from "@/features/identity/permissions";
import { assertPermission } from "@/features/identity/server/access";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/db/generated/client";
import { lockRow, ModulError, transactionScope } from "./common";

export const PROOF_OUTCOMES = {
  DELIVERED: "DITERIMA",
  RETURNED: "RETUR",
} as const;
const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

export type TrackingEvent = { at: string; by: string | null; text: string };
export type ProofView = {
  id: number;
  outcome: string;
  receiverName: string | null;
  notes: string | null;
  at: string;
  by: string | null;
  photos: { position: number; url: string }[];
  signatureUrl: string | null;
};
export type ScanAwbView = {
  id: number;
  awbNo: string;
  status: string;
  sender: {
    doNo: string | null;
    origin: string | null;
    name: string | null;
    address: string | null;
    phone: string | null;
  };
  receiver: {
    name: string | null;
    destination: string | null;
    address: string | null;
    phone: string | null;
  };
  goods: {
    koli: number | null;
    kilo: string | null;
    volume: string | null;
    chargeable: string | null;
  };
  tracking: TrackingEvent[];
  proofs: ProofView[];
};

/** The AWB a scan refers to, within the actor's branches. */
async function findScanned(actor: AccessActor, awbNo: string) {
  const code = awbNo.replace(/\s+/g, "").slice(0, 50);
  if (!code) throw new ModulError("Nomor AWB kosong.");
  const matches = await prisma.transaction.findMany({
    where: {
      deletedAt: null,
      awbNo: { equals: code, mode: "insensitive" },
      ...transactionScope(actor),
    },
    select: { id: true },
    take: 2,
  });
  if (!matches.length)
    throw new ModulError("AWB tidak ditemukan atau bukan milik cabang Anda.");
  if (matches.length > 1)
    throw new ModulError(
      "Nomor AWB dipakai lebih dari satu cabang. Buka lewat detail AWB.",
    );
  return matches[0].id;
}

/** Everything the courier sees after scanning (Progi-style AWB card). */
export async function awbForScan(
  actor: AccessActor,
  transactionId: number,
): Promise<ScanAwbView> {
  const t = await prisma.transaction.findFirst({
    where: { id: transactionId, deletedAt: null, ...transactionScope(actor) },
    select: {
      id: true,
      awbNo: true,
      status: true,
      doNo: true,
      senderName: true,
      senderAddress: true,
      senderPhone: true,
      receiverName: true,
      receiverAddress: true,
      receiverPhone: true,
      koli: true,
      kilo: true,
      volume: true,
      chargeableWeight: true,
      createdAt: true,
      createdBy: { select: { name: true } },
      originBranch: { select: { name: true } },
      destinationBranch: { select: { name: true } },
      statusHistory: {
        orderBy: { changedAt: "asc" },
        select: {
          changedAt: true,
          priorStatus: true,
          newStatus: true,
          reason: true,
          actor: { select: { name: true } },
        },
      },
      manifestItems: {
        select: {
          assignedAt: true,
          manifest: { select: { manifestNo: true } },
          assignedBy: { select: { name: true } },
        },
      },
      deliveryProofs: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          outcome: true,
          receiverName: true,
          notes: true,
          createdAt: true,
          signatureUrl: true,
          createdBy: { select: { name: true } },
          photos: {
            where: { deletedAt: null },
            orderBy: { position: "asc" },
            select: { position: true, url: true },
          },
        },
      },
    },
  });
  if (!t)
    throw new ModulError("AWB tidak ditemukan atau bukan milik cabang Anda.");
  const origin = t.originBranch?.name ?? null;
  const tracking: TrackingEvent[] = [
    {
      at: t.createdAt.toISOString(),
      by: t.createdBy?.name ?? null,
      text: `Transaksi diinput oleh ${t.createdBy?.name ?? "petugas"} di kantor/on site cabang ${origin ?? "-"}`,
    },
    ...t.manifestItems.map((m) => ({
      at: m.assignedAt.toISOString(),
      by: m.assignedBy?.name ?? null,
      text: `Masuk manifest ${m.manifest.manifestNo}`,
    })),
    ...t.statusHistory
      .filter((h) => h.priorStatus !== null)
      .map((h) => ({
        at: h.changedAt.toISOString(),
        by: h.actor?.name ?? null,
        text: `Status ${h.priorStatus} → ${h.newStatus}${h.reason ? ` (${h.reason})` : ""}`,
      })),
    ...t.deliveryProofs.map((p) => ({
      at: p.createdAt.toISOString(),
      by: p.createdBy?.name ?? null,
      text: `${PROOF_OUTCOMES[p.outcome as "DELIVERED"] ?? p.outcome}${p.receiverName ? ` oleh ${p.receiverName}` : ""}${p.notes ? ` — ${p.notes}` : ""}`,
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  return {
    id: t.id,
    awbNo: t.awbNo ?? `#${t.id}`,
    status: t.status,
    sender: {
      doNo: t.doNo,
      origin,
      name: t.senderName,
      address: t.senderAddress,
      phone: t.senderPhone,
    },
    receiver: {
      name: t.receiverName,
      destination: t.destinationBranch?.name ?? null,
      address: t.receiverAddress,
      phone: t.receiverPhone,
    },
    goods: {
      koli: t.koli,
      kilo: t.kilo?.toString() ?? null,
      volume: t.volume?.toString() ?? null,
      chargeable: t.chargeableWeight?.toString() ?? null,
    },
    tracking,
    proofs: t.deliveryProofs.map((p) => ({
      id: p.id,
      outcome: p.outcome,
      receiverName: p.receiverName,
      notes: p.notes,
      at: p.createdAt.toISOString(),
      by: p.createdBy?.name ?? null,
      photos: p.photos,
      signatureUrl: p.signatureUrl,
    })),
  };
}

export async function scanLookup(actor: AccessActor, awbNo: string) {
  assertPermission(actor, "use", "awb_scan");
  return awbForScan(actor, await findScanned(actor, awbNo));
}

/** Whether a proof with this outcome may be recorded now (checked before uploads). */
function checkOutcome(status: string, outcome: "DELIVERED" | "RETURNED") {
  if (status === "Delivered") throw new ModulError("AWB ini sudah DITERIMA.");
  if (status === "Cancelled") throw new ModulError("AWB ini sudah dibatalkan.");
  if (outcome === "DELIVERED" && status !== "Open" && status !== "In Transit")
    throw new ModulError(`Status ${status} tidak bisa dikonfirmasi DITERIMA.`);
}

export async function assertProofAllowed(
  actor: AccessActor,
  transactionId: number,
  outcome: "DELIVERED" | "RETURNED",
) {
  assertPermission(actor, "use", "awb_scan");
  const t = await prisma.transaction.findFirst({
    where: { id: transactionId, deletedAt: null, ...transactionScope(actor) },
    select: { status: true },
  });
  if (!t)
    throw new ModulError("AWB tidak ditemukan atau bukan milik cabang Anda.");
  checkOutcome(t.status, outcome);
}

const proofSchema = z
  .object({
    transactionId: z.coerce.number().int().positive(),
    outcome: z.enum(["DELIVERED", "RETURNED"]),
    receiverName: z.string().trim().max(150).optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .refine((v) => v.outcome !== "DELIVERED" || !!v.receiverName, {
    message: "Nama penerima wajib diisi untuk status DITERIMA.",
    path: ["receiverName"],
  });

export type UploadedImage = { url: string; publicId: string };

/**
 * Record a bukti terima. DITERIMA moves the AWB to Delivered (through In
 * Transit when still Open), each step in the status history with reason
 * "Scan AWB"; RETUR keeps the AWB status (D-09 open). An open delivery
 * sheet line of the AWB gets the same outcome.
 */
export async function recordProof(
  actor: AccessActor,
  input: unknown,
  uploads: { photos: UploadedImage[]; signature?: UploadedImage },
) {
  assertPermission(actor, "use", "awb_scan");
  const parsed = proofSchema.safeParse(input);
  if (!parsed.success)
    throw new ModulError(
      parsed.error.issues[0]?.message ?? "Isian belum valid.",
    );
  const data = parsed.data;
  if (uploads.photos.length > 5) throw new ModulError("Maksimal 5 foto.");
  return prisma.$transaction(async (tx) => {
    await lockRow(tx, "transactions", data.transactionId);
    const t = await tx.transaction.findFirst({
      where: {
        id: data.transactionId,
        deletedAt: null,
        ...transactionScope(actor),
      },
      select: { id: true, status: true },
    });
    if (!t)
      throw new ModulError("AWB tidak ditemukan atau bukan milik cabang Anda.");
    checkOutcome(t.status, data.outcome);
    if (data.outcome === "DELIVERED") {
      const steps =
        t.status === "Open" ? ["In Transit", "Delivered"] : ["Delivered"];
      let prior = t.status;
      for (const next of steps) {
        if (!(ALLOWED_TRANSITIONS[prior] ?? []).includes(next))
          throw new ModulError(`Status ${prior} tidak bisa diubah ke ${next}.`);
        await tx.transaction.update({
          where: { id: t.id },
          data: { status: next },
        });
        await tx.transactionStatusHistory.create({
          data: {
            transactionId: t.id,
            priorStatus: prior,
            newStatus: next,
            reason: "Scan AWB",
            actorId: actor.id,
          },
        });
        prior = next;
      }
    }
    const proof = await tx.deliveryProof.create({
      data: {
        transactionId: t.id,
        outcome: data.outcome,
        receiverName: data.receiverName || null,
        notes: data.notes || null,
        signatureUrl: uploads.signature?.url ?? null,
        signaturePublicId: uploads.signature?.publicId ?? null,
        createdById: actor.id,
        photos: {
          create: uploads.photos.map((p, index) => ({
            position: index + 1,
            url: p.url,
            publicId: p.publicId,
          })),
        },
      },
      select: { id: true },
    });
    await syncDeliverySheet(tx, t.id, data);
    return proof;
  });
}

/** Mirror the outcome on the AWB's open delivery sheet line, if any. */
async function syncDeliverySheet(
  tx: Prisma.TransactionClient,
  transactionId: number,
  data: {
    outcome: "DELIVERED" | "RETURNED";
    receiverName?: string;
    notes?: string;
  },
) {
  const active = await tx.manifestItem.findFirst({
    where: {
      transactionId,
      deletedAt: null,
      releasedAt: null,
      manifest: { deletedAt: null },
    },
    select: {
      manifest: { select: { deliverySheet: { select: { id: true } } } },
    },
  });
  const sheetId = active?.manifest.deliverySheet?.id;
  if (!sheetId) return;
  const values = {
    outcome: data.outcome,
    receivedBy: data.receiverName || null,
    notes: data.notes || null,
    deliveredAt: data.outcome === "DELIVERED" ? new Date() : null,
  };
  const line = await tx.deliverySheetItem.findUnique({
    where: {
      deliverySheetId_transactionId: {
        deliverySheetId: sheetId,
        transactionId,
      },
    },
    select: { id: true, outcome: true, deletedAt: true },
  });
  if (!line)
    await tx.deliverySheetItem.create({
      data: { deliverySheetId: sheetId, transactionId, ...values },
    });
  else if (
    !line.deletedAt &&
    line.outcome !== "DELIVERED" &&
    line.outcome !== "RETURNED"
  )
    await tx.deliverySheetItem.update({ where: { id: line.id }, data: values });
}

export { iso };
