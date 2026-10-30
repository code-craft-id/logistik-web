import "server-only";

import { Prisma } from "@/lib/db/generated/client";
import { prisma } from "@/lib/db";
import { IdentityError } from "@/features/identity/server/access";
import { permitsBranch, type AccessActor } from "@/features/identity/permissions";
import {
  createBookingSchema,
  createTransactionSchema,
  updateTransactionStatusSchema,
  type CreateBookingInput,
  type CreateTransactionInput,
  type UpdateTransactionStatusInput,
} from "../schemas";

export async function createBooking(input: CreateBookingInput, actor: AccessActor) {
  const data = createBookingSchema.parse(input);
  if (data.branchId && !permitsBranch(actor, data.branchId)) {
    throw new IdentityError("FORBIDDEN_BRANCH", 403);
  }
  const { status: _status, ...bookingData } = data as any;
  return prisma.booking.create({
    data: {
      ...bookingData,
      createdById: actor.id,
    },
  });
}

function payloadMatchesExisting(existing: any, data: any) {
  // Compare key fields that define the business payload; ignore server-set fields
  const fields = [
    "bookingId",
    "awbNo",
    "doNo",
    "senderName",
    "receiverName",
    "originBranchId",
    "destinationBranchId",
    "koli",
    "courierId",
  ];
  for (const f of fields) {
    const a = existing[f];
    const b = data[f];
    if (a === b) continue;
    if (a == null && b == null) continue;
    // Normalize numbers
    if (typeof a === "number" && typeof b === "number" && a === b) continue;
    if (typeof a === "bigint" && typeof b === "bigint" && a === b) continue;
    // For decimals/strings, compare string forms loosely
    if (String(a ?? null) !== String(b ?? null)) {
      return false;
    }
  }
  // Compare decimals as strings
  const decFields = ["kilo", "volume", "biaya"];
  for (const f of decFields) {
    const a = existing[f];
    const b = data[f];
    if (a == null && (b == null || b === undefined)) continue;
    if ((a == null) !== ((b == null || b === undefined))) return false;
    if (a != null && b != null) {
      if (a.toString() !== b.toString()) return false;
    }
  }
  return true;
}

export async function createTransaction(
  input: CreateTransactionInput,
  actor: AccessActor,
) {
  const data = createTransactionSchema.parse(input) as any;
  if (!permitsBranch(actor, data.originBranchId)) {
    throw new IdentityError("FORBIDDEN_BRANCH", 403);
  }
  if (
    data.destinationBranchId &&
    !permitsBranch(actor, data.destinationBranchId)
  ) {
    throw new IdentityError("FORBIDDEN_BRANCH", 403);
  }

  return prisma.$transaction(async (tx: any) => {
    if (data.idempotencyKey) {
      const existingByKey = await tx.transaction.findUnique({
        where: { idempotencyKey: data.idempotencyKey },
      });
      if (existingByKey) {
        if (!payloadMatchesExisting(existingByKey, data)) {
          throw new Error("IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD");
        }
        return { transaction: existingByKey, created: false, idempotent: true };
      }
    }
    if (data.awbNo && data.originBranchId) {
      const existingByAwb = await tx.transaction.findFirst({
        where: {
          originBranchId: data.originBranchId,
          awbNo: data.awbNo,
          deletedAt: null,
        },
      });
      if (existingByAwb) {
        if (data.idempotencyKey && existingByAwb.idempotencyKey && existingByAwb.idempotencyKey !== data.idempotencyKey) {
          throw new Error("IDEMPOTENCY_CONFLICT_AWB_EXISTS_WITH_DIFFERENT_KEY");
        }
        if (!payloadMatchesExisting(existingByAwb, data)) {
          throw new Error("AWB_EXISTS_WITH_DIFFERENT_PAYLOAD");
        }
        return { transaction: existingByAwb, created: false, idempotent: true, matchedBy: "awb" };
      }
    }

    try {
      const { status: _status, idempotencyKey, ...rest } = data;
      const created = await tx.transaction.create({
        data: {
          ...rest,
          idempotencyKey: idempotencyKey ?? null,
          status: "Open",
          createdById: actor.id,
        },
      });
      await tx.transactionStatusHistory.create({
        data: {
          transactionId: created.id,
          priorStatus: null,
          newStatus: "Open",
          reason: "CREATED",
          actorId: actor.id,
        },
      });
      return { transaction: created, created: true, idempotent: false };
    } catch (e: unknown) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        if (data.idempotencyKey) {
          const existingByKey = await tx.transaction.findUnique({
            where: { idempotencyKey: data.idempotencyKey },
          });
          if (existingByKey) {
            if (!payloadMatchesExisting(existingByKey, data)) {
              throw new Error("IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD");
            }
            return { transaction: existingByKey, created: false, idempotent: true };
          }
        }
        if (data.awbNo && data.originBranchId) {
          const existingByAwb = await tx.transaction.findFirst({
            where: {
              originBranchId: data.originBranchId,
              awbNo: data.awbNo,
              deletedAt: null,
            },
          });
          if (existingByAwb) {
            if (data.idempotencyKey && existingByAwb.idempotencyKey && existingByAwb.idempotencyKey !== data.idempotencyKey) {
              throw new Error("IDEMPOTENCY_CONFLICT_AWB_EXISTS_WITH_DIFFERENT_KEY");
            }
            if (!payloadMatchesExisting(existingByAwb, data)) {
              throw new Error("AWB_EXISTS_WITH_DIFFERENT_PAYLOAD");
            }
            return { transaction: existingByAwb, created: false, idempotent: true, matchedBy: "awb" };
          }
        }
      }
      throw e;
    }
  });
}

export async function updateTransactionStatus(
  input: UpdateTransactionStatusInput,
  actor: AccessActor,
) {
  const data = updateTransactionStatusSchema.parse(input);

  return prisma.$transaction(async (tx: any) => {
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

    const { ALLOWED_TRANSITIONS } = await import("../status");
    const allowed = ALLOWED_TRANSITIONS[transaction.status] || [];
    if (!allowed.includes(data.newStatus)) {
      throw new Error("INVALID_STATUS_TRANSITION");
    }

    const updated = await tx.transaction.update({
      where: { id: transaction.id },
      data: { status: data.newStatus },
    });

    await tx.transactionStatusHistory.create({
      data: {
        transactionId: transaction.id,
        priorStatus: transaction.status,
        newStatus: data.newStatus,
        reason: data.reason || null,
        actorId: actor.id,
      },
    });

    return updated;
  });
}
