import "server-only";

import { Prisma } from "@/lib/db/generated/client";
import { prisma } from "@/lib/db";
import { IdentityError } from "@/features/identity/server/access";
import { permitsBranch, type AccessActor } from "@/features/identity/permissions";
import { ALLOWED_TRANSITIONS } from "../../bookings/status";
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
  if (!data.branchId) {
    throw new IdentityError("FORBIDDEN_BRANCH", 403);
  }
  if (!permitsBranch(actor, data.branchId)) {
    throw new IdentityError("FORBIDDEN_BRANCH", 403);
  }

  const { isAdministrator } = await import("@/features/identity/permissions");

  return prisma.$transaction(async (tx: TxClient) => {
    if (data.originBranchId && !permitsBranch(actor, data.originBranchId)) {
      throw new IdentityError("FORBIDDEN_BRANCH", 403);
    }
    if (data.destinationBranchId && !permitsBranch(actor, data.destinationBranchId)) {
      throw new IdentityError("FORBIDDEN_BRANCH", 403);
    }

    if (data.vehicleId) {
      const vehicle = await tx.vehicle.findFirst({
        where: {
          id: data.vehicleId,
          ...(isAdministrator(actor) ? {} : { branchId: { in: actor.branchIds } }),
        },
      });
      if (!vehicle) {
        throw new IdentityError("FORBIDDEN_BRANCH", 403);
      }
    }
    if (data.courierId) {
      const courier = await tx.courier.findFirst({
        where: {
          id: data.courierId,
          deletedAt: null,
          status: "ACTIVE",
          ...(isAdministrator(actor)
            ? {}
            : {
                OR: [
                  { branchId: { in: actor.branchIds } },
                  { branchId: null },
                ],
              }),
        },
      });
      if (!courier) {
        throw new IdentityError("FORBIDDEN_BRANCH", 403);
      }
    }

    return tx.manifest.create({
      data: {
        manifestNo: data.manifestNo,
        manifestDate: data.manifestDate,
        type: data.type ?? null,
        branchId: data.branchId,
        vehicleId: data.vehicleId ?? null,
        courierId: data.courierId ?? null,
        originBranchId: data.originBranchId ?? null,
        destinationBranchId: data.destinationBranchId ?? null,
        status: "Draft",
        transit1: data.transit1 ?? null,
        transit2: data.transit2 ?? null,
        transit3: data.transit3 ?? null,
        transit4: data.transit4 ?? null,
        transit5: data.transit5 ?? null,
        createdById: actor.id,
      },
    });
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
    if (manifest.status === "Closed") {
      throw new Error("MANIFEST_NOT_ASSIGNABLE");
    }

    const { isAdministrator } = await import("@/features/identity/permissions");
    const transaction = await tx.transaction.findFirst({
      where: {
        id: data.transactionId,
        deletedAt: null,
        ...(isAdministrator(actor)
          ? {}
          : {
              OR: [
                { originBranchId: { in: actor.branchIds } },
                { destinationBranchId: { in: actor.branchIds } },
              ],
            }),
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

    try {
      const item = await tx.manifestItem.create({
        data: {
          manifestId: data.manifestId,
          transactionId: data.transactionId,
          assignedById: actor.id,
        },
      });
      return item;
    } catch (e: unknown) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        throw new Error("TRANSACTION_ALREADY_ASSIGNED");
      }
      throw e;
    }
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
    const { isAdministrator } = await import("@/features/identity/permissions");
    const sheet = await tx.deliverySheet.findUnique({
      where: { id: data.deliverySheetId },
      include: { manifest: true },
    });
    if (!sheet) throw new Error("DELIVERY_SHEET_NOT_FOUND");
    if (!sheet.manifest.branchId || (!isAdministrator(actor) && !actor.branchIds.includes(sheet.manifest.branchId))) {
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
    if (!isAdministrator(actor)) {
      const inScope =
        (txRecord.originBranchId && actor.branchIds.includes(txRecord.originBranchId)) ||
        (txRecord.destinationBranchId && actor.branchIds.includes(txRecord.destinationBranchId));
      if (!inScope) {
        throw new IdentityError("FORBIDDEN_BRANCH", 403);
      }
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
      if (allowedItem.outcome === "DELIVERED") {
        throw new Error("DELIVERY_OUTCOME_FINAL");
      }
      if (allowedItem.outcome === "RETURNED") {
        throw new Error("DELIVERY_OUTCOME_FINAL");
      }
      const resultUpd = await tx.deliverySheetItem.updateMany({
        where: {
          deliverySheetId: data.deliverySheetId,
          transactionId: data.transactionId,
          outcome: allowedItem.outcome ?? null,
        },
        data: {
          outcome: data.outcome || null,
          receivedBy: data.receivedBy || null,
          notes: data.notes || null,
          deliveredAt: data.outcome === "DELIVERED" ? new Date() : null,
        },
      });
      if (resultUpd.count !== 1) {
        throw new Error("DELIVERY_OUTCOME_CONCURRENTLY_UPDATED");
      }
    }

    if (data.outcome === "DELIVERED") {
      if (txRecord.status !== "Delivered") {
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
