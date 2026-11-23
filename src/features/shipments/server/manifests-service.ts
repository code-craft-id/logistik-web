import "server-only";

import {
  type AccessActor,
  permitsBranch,
} from "@/features/identity/permissions";
import { IdentityError } from "@/features/identity/server/access";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/db/generated/client";
import { ALLOWED_TRANSITIONS } from "../../bookings/status";
import {
  type AssignToManifestInput,
  assignToManifestSchema,
  type CreateManifestInput,
  createManifestSchema,
  type DeliveryOutcomeInput,
  deliveryOutcomeSchema,
} from "../manifests-schemas";

type TxClient = Prisma.TransactionClient;

export async function createManifest(
  input: CreateManifestInput,
  actor: AccessActor,
) {
  const data = createManifestSchema.parse(input);
  const { isAdministrator } = await import("@/features/identity/permissions");
  if (
    !isAdministrator(actor) &&
    (!actor.branchIds || actor.branchIds.length === 0)
  ) {
    throw new IdentityError("FORBIDDEN_BRANCH", 403);
  }
  if (
    data.branchId == null ||
    !Number.isSafeInteger(data.branchId) ||
    data.branchId <= 0
  ) {
    if (isAdministrator(actor)) {
      throw new IdentityError(
        "FORBIDDEN_BRANCH",
        403,
        "Cabang manifest wajib diisi untuk administrator.",
      );
    }
    throw new IdentityError(
      "FORBIDDEN_BRANCH",
      403,
      "Cabang manifest wajib diisi.",
    );
  }
  if (!permitsBranch(actor, data.branchId)) {
    throw new IdentityError("FORBIDDEN_BRANCH", 403);
  }
  if (data.originBranchId != null) {
    if (
      !Number.isSafeInteger(data.originBranchId) ||
      data.originBranchId <= 0
    ) {
      throw new IdentityError(
        "FORBIDDEN_BRANCH",
        403,
        "Cabang asal tidak valid.",
      );
    }
  }
  if (data.destinationBranchId != null) {
    if (
      !Number.isSafeInteger(data.destinationBranchId) ||
      data.destinationBranchId <= 0
    ) {
      throw new IdentityError(
        "FORBIDDEN_BRANCH",
        403,
        "Cabang tujuan tidak valid.",
      );
    }
  }

  return prisma.$transaction(async (tx: TxClient) => {
    if (data.originBranchId && !permitsBranch(actor, data.originBranchId)) {
      throw new IdentityError("FORBIDDEN_BRANCH", 403);
    }
    if (
      data.destinationBranchId &&
      !permitsBranch(actor, data.destinationBranchId)
    ) {
      throw new IdentityError("FORBIDDEN_BRANCH", 403);
    }

    if (data.vehicleId) {
      const vehicle = await tx.vehicle.findFirst({
        where: {
          id: data.vehicleId,
          deletedAt: null,
          ...(isAdministrator(actor)
            ? {}
            : { branchId: { in: actor.branchIds } }),
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
                OR: [{ branchId: { in: actor.branchIds } }, { branchId: null }],
              }),
        },
      });
      if (!courier) {
        throw new IdentityError("FORBIDDEN_BRANCH", 403);
      }
    }

    if (data.vendorId) {
      const vendor = await tx.vendor.findFirst({
        where: { id: data.vendorId, deletedAt: null, status: "ACTIVE" },
        select: { id: true },
      });
      if (!vendor) throw new IdentityError("FORBIDDEN_BRANCH", 403);
    }

    return tx.manifest.create({
      data: {
        manifestNo: data.manifestNo,
        manifestDate: data.manifestDate,
        type: data.type ?? null,
        branchId: data.branchId,
        vehicleId: data.vehicleId ?? null,
        courierId: data.courierId ?? null,
        vendorId: data.vendorId ?? null,
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
  const { isAdministrator } = await import("@/features/identity/permissions");
  if (
    !isAdministrator(actor) &&
    (!actor.branchIds || actor.branchIds.length === 0)
  ) {
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
    if (!manifest.branchId) {
      throw new IdentityError("FORBIDDEN_BRANCH", 403);
    }
    if (!permitsBranch(actor, manifest.branchId)) {
      throw new IdentityError("FORBIDDEN_BRANCH", 403);
    }
    if (manifest.status === "Closed") {
      throw new Error("MANIFEST_NOT_ASSIGNABLE");
    }

    // Serialize with an approved AWB delete (Persetujuan Edit/delete AWB),
    // which locks the same row before checking manifest membership.
    await tx.$queryRaw`SELECT id FROM transactions WHERE id = ${data.transactionId} FOR UPDATE`;
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

    // D-08 (TBD): ManifestItem has @@unique([transactionId]) globally.
    // A released historical assignment still blocks reassignment until domain
    // confirms re-manifest rules and an approved migration/constraint strategy
    // (e.g. partial unique on releasedAt IS NULL) is applied. Do not relax.
    const historical = await tx.manifestItem.findFirst({
      where: {
        transactionId: data.transactionId,
      },
      select: { id: true, releasedAt: true },
    });
    if (historical) {
      throw new Error(
        "TRANSACTION_REASSIGNMENT_BLOCKED_D08: reassignment of a released transaction is not allowed until D-08 re-manifest rules are confirmed",
      );
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
        // Race/constraint fallback. Active conflicts map to the standard domain
        // error; released-history conflicts remain blocked under D-08.
        throw new Error("TRANSACTION_ALREADY_ASSIGNED");
      }
      throw e;
    }
  });
}

export type DeliveryPhoto = { url: string; publicId: string };

export async function recordDeliveryOutcome(
  input: DeliveryOutcomeInput,
  actor: AccessActor,
) {
  const data = deliveryOutcomeSchema.parse(input);
  const { isAdministrator } = await import("@/features/identity/permissions");
  if (
    !isAdministrator(actor) &&
    (!actor.branchIds || actor.branchIds.length === 0)
  ) {
    throw new IdentityError("FORBIDDEN_BRANCH", 403);
  }

  return prisma.$transaction(async (tx: TxClient) => {
    const sheet = await tx.deliverySheet.findUnique({
      where: { id: data.deliverySheetId },
    });
    if (!sheet || sheet.deletedAt) throw new Error("DELIVERY_SHEET_NOT_FOUND");

    // Standalone DRS (Kurir Kota): the line must already be on the sheet and
    // the sheet's own branch decides access. Manifest DRS: the AWB must be
    // actively assigned to that manifest.
    if (sheet.manifestId === null) {
      if (!sheet.branchId || !permitsBranch(actor, sheet.branchId)) {
        throw new IdentityError("FORBIDDEN_BRANCH", 403);
      }
    } else {
      const manifest = await tx.manifest.findFirst({
        where: {
          id: sheet.manifestId,
          deletedAt: null,
        },
      });
      if (!manifest) {
        throw new Error("MANIFEST_NOT_FOUND");
      }
      if (!manifest.branchId) {
        throw new IdentityError("FORBIDDEN_BRANCH", 403);
      }
      if (!permitsBranch(actor, manifest.branchId)) {
        throw new IdentityError("FORBIDDEN_BRANCH", 403);
      }

      const manifestItem = await tx.manifestItem.findFirst({
        where: {
          manifestId: manifest.id,
          transactionId: data.transactionId,
          releasedAt: null,
          deletedAt: null,
        },
      });
      if (!manifestItem) {
        throw new Error("MANIFEST_ITEM_NOT_FOUND");
      }
    }

    const txRecord = await tx.transaction.findFirst({
      where: { id: data.transactionId, deletedAt: null },
    });
    if (!txRecord) {
      throw new Error("TRANSACTION_NOT_FOUND");
    }
    // Ensure transaction is in scope
    if (!isAdministrator(actor)) {
      const inScope =
        (txRecord.originBranchId &&
          actor.branchIds.includes(txRecord.originBranchId)) ||
        (txRecord.destinationBranchId &&
          actor.branchIds.includes(txRecord.destinationBranchId));
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
    if (allowedItem?.deletedAt) {
      throw new Error("DELIVERY_SHEET_ITEM_NOT_FOUND");
    }
    if (!allowedItem && sheet.manifestId === null) {
      throw new Error("DELIVERY_SHEET_ITEM_NOT_FOUND");
    }
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
          deletedAt: null,
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

/** The delivery line a photo may be attached to, with all access checks. */
async function photoTarget(
  db: TxClient | typeof prisma,
  input: { deliverySheetId: number; transactionId: number },
  actor: AccessActor,
) {
  const { isAdministrator } = await import("@/features/identity/permissions");
  const item = await db.deliverySheetItem.findFirst({
    where: {
      deliverySheetId: input.deliverySheetId,
      transactionId: input.transactionId,
      deletedAt: null,
    },
    select: {
      id: true,
      outcome: true,
      podPhotoUrl: true,
      deliverySheet: {
        select: {
          branchId: true,
          deletedAt: true,
          manifest: { select: { branchId: true, deletedAt: true } },
        },
      },
      transaction: {
        select: { originBranchId: true, destinationBranchId: true },
      },
    },
  });
  const sheet = item?.deliverySheet;
  if (!item || !sheet || sheet.deletedAt || sheet.manifest?.deletedAt)
    throw new Error("DELIVERY_SHEET_ITEM_NOT_FOUND");
  const owner = sheet.manifest ? sheet.manifest.branchId : sheet.branchId;
  if (!owner || !permitsBranch(actor, owner))
    throw new IdentityError("FORBIDDEN_BRANCH", 403);
  if (
    !isAdministrator(actor) &&
    ![
      item.transaction.originBranchId,
      item.transaction.destinationBranchId,
    ].some((b) => b !== null && actor.branchIds.includes(b))
  )
    throw new IdentityError("FORBIDDEN_BRANCH", 403);
  if (!item.outcome) throw new Error("DELIVERY_PHOTO_NEEDS_OUTCOME");
  if (item.podPhotoUrl) throw new Error("DELIVERY_PHOTO_EXISTS");
  return item;
}

/**
 * Check, before any upload, that the actor may add a photo to this line:
 * branch access, AWB scope, recorded outcome and no photo yet. Uploading
 * only after this keeps unauthorized users from using the Cloudinary quota.
 */
export async function assertDeliveryPhotoAllowed(
  input: { deliverySheetId: number; transactionId: number },
  actor: AccessActor,
) {
  await photoTarget(prisma, input, actor);
}

/**
 * Add a proof-of-delivery photo to a delivery sheet line that already has an
 * outcome and no photo yet. The checks repeat inside the transaction and the
 * update only matches a line without a photo, so an existing photo (evidence
 * as first recorded) is never replaced, even by a concurrent upload.
 */
export async function attachDeliveryPhoto(
  input: { deliverySheetId: number; transactionId: number },
  actor: AccessActor,
  photo: DeliveryPhoto,
) {
  return prisma.$transaction(async (tx: TxClient) => {
    const item = await photoTarget(tx, input, actor);
    const updated = await tx.deliverySheetItem.updateMany({
      where: { id: item.id, podPhotoUrl: null },
      data: {
        podPhotoUrl: photo.url,
        podPhotoPublicId: photo.publicId,
        podPhotoAt: new Date(),
      },
    });
    if (updated.count !== 1) throw new Error("DELIVERY_PHOTO_EXISTS");
    return { id: item.id };
  });
}
