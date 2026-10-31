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

type TxClient = Prisma.TransactionClient;

export async function createBooking(input: CreateBookingInput, actor: AccessActor) {
  const data = createBookingSchema.parse(input);
  if (!actor.branchIds || actor.branchIds.length === 0) {
    throw new IdentityError("FORBIDDEN_BRANCH", 403);
  }
  const branchId = data.branchId ?? actor.branchIds[0];
  if (!branchId) {
    throw new IdentityError("FORBIDDEN_BRANCH", 403);
  }
  if (!permitsBranch(actor, branchId)) {
    throw new IdentityError("FORBIDDEN_BRANCH", 403);
  }
  const { status: _status, ...bookingData } = data as any;
  return prisma.booking.create({
    data: {
      ...bookingData,
      branchId,
      createdById: actor.id,
    },
  });
}

function normalizeDecimal(v: unknown) {
  if (v == null) return null;
  if (typeof v === "string") {
    const t = v.trim();
    if (t === "") return null;
    // Normalize by removing unnecessary trailing zeros
    if (t.includes(".")) {
      const [intPart, fracPart] = t.split(".");
      const fracTrimmed = fracPart.replace(/0+$/, "");
      return fracTrimmed.length === 0 ? intPart || "0" : `${intPart}.${fracTrimmed}`;
    }
    return t;
  }
  if (typeof v === "number") {
    if (!Number.isFinite(v)) return null;
    return v.toString();
  }
  if (typeof v === "object" && v !== null && "toString" in v) {
    const s = (v as any).toString();
    // Try to normalize decimal string representation
    try {
      // Basic normalization
      if (s.includes(".")) {
        const [intPart, fracPart] = s.split(".");
        const fracTrimmed = fracPart.replace(/0+$/, "");
        return fracTrimmed.length === 0 ? intPart || "0" : `${intPart}.${fracTrimmed}`;
      }
      return s;
    } catch {
      return s;
    }
  }
  return String(v);
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
    "courierId",
  ];
  for (const f of fields) {
    const a = existing[f];
    const b = data[f];
    if (a === b) continue;
    if (a == null && b == null) continue;
    if (a == null && b === undefined) continue;
    if (b == null && a === undefined) continue;
    // Normalize numbers
    if (typeof a === "number" && typeof b === "number" && a === b) continue;
    if (typeof a === "bigint" && typeof b === "bigint" && a === b) continue;
    if (String(a ?? null) !== String(b ?? null)) {
      return false;
    }
  }
  // Compare koli with server default 0
  const aKoli = existing["koli"] ?? 0;
  const bKoli = data["koli"] ?? 0;
  if (Number(aKoli) !== Number(bKoli)) {
    return false;
  }
  // Compare decimals as normalized strings
  const decFields = ["kilo", "volume", "biaya"];
  for (const f of decFields) {
    const aNorm = normalizeDecimal(existing[f]);
    const bNorm = normalizeDecimal(data[f]);
    if (aNorm !== bNorm) return false;
  }
  return true;
}

export async function createTransaction(
  input: CreateTransactionInput,
  actor: AccessActor,
) {
  const data = createTransactionSchema.parse(input) as any;
  if (!actor.branchIds || actor.branchIds.length === 0) {
    throw new IdentityError("FORBIDDEN_BRANCH", 403);
  }
  if (!permitsBranch(actor, data.originBranchId)) {
    throw new IdentityError("FORBIDDEN_BRANCH", 403);
  }
  if (
    data.destinationBranchId &&
    !permitsBranch(actor, data.destinationBranchId)
  ) {
    throw new IdentityError("FORBIDDEN_BRANCH", 403);
  }

  try {
    return await prisma.$transaction(async (tx: TxClient) => {
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
    });
  } catch (e: unknown) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      if (data.idempotencyKey) {
        const existingByKey = await prisma.transaction.findUnique({
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
        const existingByAwb = await prisma.transaction.findFirst({
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
}

export async function updateTransactionStatus(
  input: UpdateTransactionStatusInput,
  actor: AccessActor,
) {
  const data = updateTransactionStatusSchema.parse(input);
  if (!actor.branchIds || actor.branchIds.length === 0) {
    throw new IdentityError("FORBIDDEN_BRANCH", 403);
  }

  return prisma.$transaction(async (tx: TxClient) => {
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

    const result = await tx.transaction.updateMany({
      where: { id: transaction.id, status: transaction.status },
      data: { status: data.newStatus },
    });
    if (result.count !== 1) {
      throw new Error("STATUS_CONCURRENTLY_UPDATED");
    }

    const updated = await tx.transaction.findUnique({
      where: { id: transaction.id },
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
