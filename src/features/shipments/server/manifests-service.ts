import "server-only";

import { Prisma } from "@/lib/db/generated/client";
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

type TxClient = Prisma.TransactionClient;

export async function createManifest(input: CreateManifestInput, actor: AccessActor) {
  const data = createManifestSchema.parse(input);
  if (!actor.branchIds || actor.branchIds.length === 0) {
    throw new IdentityError("FORBIDDEN_BRANCH", 403);
  }
  if (data.branchId) {
    if (!permitsBranch(actor, data.branchId)) {
      throw new IdentityError("FORBIDDEN_BRANCH", 403);
    }
  } else {
    // Require branch assignment
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
  if (!actor.branchIds || actor.branchIds.length === 0) {
    throw new IdentityError("FORBIDDEN_BRANCH", 403);
  }

  return prisma.$transaction(async (tx: TxClient) => {
    const manifest = await tx.manifest.findFirst({
      where: {
        id: data.manifestId,
        deletedAt: null,
      },
    });
    if (!manifest) throw new IdentityError("FORBIDDEN_BRANCH", 403);
    if (!manifest.branchId || !actor.branchIds.includes(manifest.branchId)) {
      throw new IdentityError("FORBIDDEN_BRANCH", 403);
    }
    if (manifest.status === "Closed" || manifest.status === "Cancelled") {
      throw new Error("MANIFEST_NOT_ASSIGNABLE");
    }

    const transaction = await tx.transaction.findFirst({
      where: {
        id: data.transactionId,
        deletedAt: null,
        OR: [
          { originBranchId: { in: actor.branchIds } },
          { destinationBranchId: { in: actor.branchIds } },
        ],
      },
    });
    if (!transaction) {
      throw new IdentityError("FORBIDDEN_BRANCH", 403);
    }

    const existing = await tx.manifestItem.findFirst({
      where: {
        transactionId: data.transactionId,
        releasedAt: null,
      },
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
  if (!actor.branchIds || actor.branchIds.length === 0) {
    throw new IdentityError("FORBIDDEN_BRANCH", 403);
  }

  return prisma.$transaction(async (tx: TxClient) => {
    const sheet = await tx.deliverySheet.findUnique({
      where: { id: data.deliverySheetId },
      include: { manifest: true },
    });
    if (!sheet) throw new Error("DELIVERY_SHEET_NOT_FOUND");
    if (!sheet.manifest.branchId || !actor.branchIds.includes(sheet.manifest.branchId)) {
      throw new IdentityError("FORBIDDEN_BRANCH", 403);
    }

    const manifestItem = await tx.manifestItem.findFirst({
      where: {
        manifestId: sheet.manifestId,
        transactionId: data.transactionId,
        releasedAt: null,
      },
    });
    if (!manifestItem) {
      throw new IdentityError("FORBIDDEN_BRANCH", 403);
    }

    const txRecord = await tx.transaction.findFirst({
      where: { id: data.transactionId, deletedAt: null },
    });
    if (!txRecord) {
      throw new IdentityError("FORBIDDEN_BRANCH", 403);
    }
    // Ensure transaction is in scope
    const inScope =
      (txRecord.originBranchId && actor.branchIds.includes(txRecord.originBranchId)) ||
      (txRecord.destinationBranchId && actor.branchIds.includes(txRecord.destinationBranchId));
    if (!inScope) {
      throw new IdentityError("FORBIDDEN_BRANCH", 403);
    }

    const allowedItem = await tx.deliverySheetItem.findUnique({
      where: {
        deliverySheetId_transactionId: {
          deliverySheetId: data.deliverySheetId,
          transactionId: data.transactionId,
        },
      },
    });
    if (!allowedItem) {
      await tx.deliverySheetItem.create({
        data: {
          deliverySheetId: data.deliverySheetId,
          transactionId: data.transactionId,
          outcome: data.outcome || null,
          receivedBy: data.receivedBy || null,
          notes: data.notes || null,
          deliveredAt: data.outcome === "DELIVERED" ? new Date() : null,
        },
      });
    } else {
      await tx.deliverySheetItem.update({
        where: {
          deliverySheetId_transactionId: {
            deliverySheetId: data.deliverySheetId,
            transactionId: data.transactionId,
          },
        },
        data: {
          outcome: data.outcome || null,
          receivedBy: data.receivedBy || null,
          notes: data.notes || null,
          deliveredAt: data.outcome === "DELIVERED" ? new Date() : null,
        },
      });
    }

    if (data.outcome === "DELIVERED") {
      if (txRecord.status !== "Delivered") {
        const { ALLOWED_TRANSITIONS } = await import(
          "../../bookings/status"
        );
        const allowed = ALLOWED_TRANSITIONS[txRecord.status] || [];
        if (!allowed.includes("Delivered")) {
          throw new Error("INVALID_STATUS_TRANSITION");
        }
        const resultUpd = await tx.transaction.updateMany({
          where: { id: txRecord.id, status: txRecord.status },
          data: { status: "Delivered" },
        });
        if (resultUpd.count !== 1) {
          throw new Error("STATUS_CONCURRENTLY_UPDATED");
        }
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

    const result = await tx.deliverySheetItem.findUnique({
      where: {
        deliverySheetId_transactionId: {
          deliverySheetId: data.deliverySheetId,
          transactionId: data.transactionId,
        },
      },
    });
    return result;
  });
}
