import "server-only";

import { prisma } from "@/lib/db";
import { IdentityError } from "@/features/identity/server/access";
import { permitsBranch, type AccessActor } from "@/features/identity/permissions";
import {
  assignToManifestSchema,
  createManifestSchema,
  deliveryOutcomeSchema,
  type AssignToManifestInput,
  type CreateManifestInput,
  type DeliveryOutcomeInput,
} from "../manifests-schemas";

export async function createManifest(input: CreateManifestInput, actor: AccessActor) {
  const data = createManifestSchema.parse(input);
  if (data.branchId && !permitsBranch(actor, data.branchId)) {
    throw new IdentityError("FORBIDDEN_BRANCH", 403);
  }

  return prisma.manifest.create({
    data: {
      ...data,
      createdById: actor.id,
    },
  });
}

export async function assignTransactionToManifest(
  input: AssignToManifestInput,
  actor: AccessActor,
) {
  const data = assignToManifestSchema.parse(input);

  return prisma.$transaction(async (tx: any) => {
    const manifest = await tx.manifest.findFirst({
      where: {
        id: data.manifestId,
        deletedAt: null,
      },
    });
    if (!manifest) throw new IdentityError("FORBIDDEN_BRANCH", 403);
    if (
      actor.branchIds.length > 0 &&
      manifest.branchId &&
      !actor.branchIds.includes(manifest.branchId)
    ) {
      throw new IdentityError("FORBIDDEN_BRANCH", 403);
    }

    const existing = await tx.manifestItem.findUnique({
      where: { transactionId: data.transactionId },
    });
    if (existing) {
      throw new Error("TRANSACTION_ALREADY_ASSIGNED");
    }

    const item = await tx.manifestItem.create({
      data: {
        manifestId: data.manifestId,
        transactionId: data.transactionId,
        assignedById: actor.id,
      },
    });
    return item;
  });
}

export async function recordDeliveryOutcome(
  input: DeliveryOutcomeInput,
  actor: AccessActor,
) {
  const data = deliveryOutcomeSchema.parse(input);

  return prisma.$transaction(async (tx: any) => {
    const sheet = await tx.deliverySheet.findUnique({
      where: { id: data.deliverySheetId },
      include: { manifest: true },
    });
    if (!sheet) throw new Error("DELIVERY_SHEET_NOT_FOUND");
    if (
      actor.branchIds.length > 0 &&
      sheet.manifest.branchId &&
      !actor.branchIds.includes(sheet.manifest.branchId)
    ) {
      throw new IdentityError("FORBIDDEN_BRANCH", 403);
    }

    const item = await tx.deliverySheetItem.upsert({
      where: {
        deliverySheetId_transactionId: {
          deliverySheetId: data.deliverySheetId,
          transactionId: data.transactionId,
        },
      },
      create: {
        deliverySheetId: data.deliverySheetId,
        transactionId: data.transactionId,
        outcome: data.outcome || null,
        receivedBy: data.receivedBy || null,
        notes: data.notes || null,
        deliveredAt: data.outcome === "DELIVERED" ? new Date() : null,
      },
      update: {
        outcome: data.outcome || null,
        receivedBy: data.receivedBy || null,
        notes: data.notes || null,
        deliveredAt: data.outcome === "DELIVERED" ? new Date() : null,
      },
    });

    if (data.outcome === "DELIVERED") {
      const txRecord = await tx.transaction.findUnique({
        where: { id: data.transactionId },
      });
      if (txRecord && txRecord.status !== "Delivered") {
        const { ALLOWED_TRANSITIONS } = await import(
          "../../bookings/status"
        );
        const allowed = ALLOWED_TRANSITIONS[txRecord.status] || [];
        if (allowed.includes("Delivered")) {
          await tx.transaction.update({
            where: { id: data.transactionId },
            data: { status: "Delivered" },
          });
          await tx.transactionStatusHistory.create({
            data: {
              transactionId: data.transactionId,
              priorStatus: txRecord.status,
              newStatus: "Delivered",
              reason: "DELIVERY_COMPLETED",
              actorId: actor.id,
            },
          });
        }
      }
    }

    return item;
  });
}
