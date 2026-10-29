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
  return prisma.booking.create({
    data: {
      ...data,
      createdById: actor.id,
    },
  });
}

export async function createTransaction(
  input: CreateTransactionInput,
  actor: AccessActor,
) {
  const data = createTransactionSchema.parse(input);
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
      const existing = await tx.transaction.findUnique({
        where: { idempotencyKey: data.idempotencyKey },
      });
      if (existing) return existing;
    }
    if (data.awbNo && data.originBranchId) {
      const existing = await tx.transaction.findFirst({
        where: {
          originBranchId: data.originBranchId,
          awbNo: data.awbNo,
          deletedAt: null,
        },
      });
      if (existing) return existing;
    }

    try {
      const created = await tx.transaction.create({
        data: {
          ...data,
          createdById: actor.id,
        },
      });
      return created;
    } catch (e: unknown) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        if (data.idempotencyKey) {
          const existing = await tx.transaction.findUnique({
            where: { idempotencyKey: data.idempotencyKey },
          });
          if (existing) return existing;
        }
        if (data.awbNo && data.originBranchId) {
          const existing = await tx.transaction.findFirst({
            where: {
              originBranchId: data.originBranchId,
              awbNo: data.awbNo,
              deletedAt: null,
            },
          });
          if (existing) return existing;
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
