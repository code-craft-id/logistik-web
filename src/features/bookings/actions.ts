"use server";

import { revalidatePath } from "next/cache";
import { IdentityError } from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";
import { requirePermission } from "@/lib/auth/session";
import type { Transaction } from "@/lib/db/generated/client";
import {
  createBookingSchema,
  createTransactionSchema,
  updateTransactionStatusSchema,
} from "./schemas";
import {
  createBooking,
  createTransaction,
  updateTransactionStatus,
} from "./server/service";

type CreateTransactionResult =
  | { transaction: Transaction; created: true; idempotent: false }
  | {
      transaction: Transaction;
      created: false;
      idempotent: true;
      matchedBy?: string;
    };

export type CreateBookingActionResult =
  | { ok: true; id: number }
  | {
      ok: false;
      error:
        | "UNAUTHENTICATED"
        | "FORBIDDEN_BRANCH"
        | "VALIDATION"
        | "CONFLICT"
        | "UNKNOWN";
    };

export type CreateTransactionActionResult =
  | {
      ok: true;
      id: number;
      created: boolean;
      idempotent: boolean;
      matchedBy?: string;
    }
  | {
      ok: false;
      error:
        | "UNAUTHENTICATED"
        | "FORBIDDEN_BRANCH"
        | "VALIDATION"
        | "CONFLICT"
        | "IDEMPOTENCY_CONFLICT"
        | "UNKNOWN";
    };

export async function createBookingAction(
  formData: FormData,
): Promise<CreateBookingActionResult> {
  try {
    await requirePermission("create", "booking");
    const current = await currentIdentity();
    if (!current) return { ok: false, error: "UNAUTHENTICATED" };

    const raw = Object.fromEntries(formData.entries());
    const parsed = createBookingSchema.parse(raw);
    const result = await createBooking(parsed, current.actor);
    revalidatePath("/bookings");
    return { ok: true, id: result.id };
  } catch (e: unknown) {
    if (e instanceof IdentityError) {
      if (e.code === "UNAUTHENTICATED")
        return { ok: false, error: "UNAUTHENTICATED" };
      if (e.code === "FORBIDDEN_BRANCH")
        return { ok: false, error: "FORBIDDEN_BRANCH" };
    }
    if (e instanceof Error && e.name === "ZodError") {
      return { ok: false, error: "VALIDATION" };
    }
    if (e instanceof Error) {
      if (e.message.includes("CONFLICT") || e.message.includes("P2002")) {
        return { ok: false, error: "CONFLICT" };
      }
    }
    return { ok: false, error: "UNKNOWN" };
  }
}

export async function createTransactionAction(
  formData: FormData,
): Promise<CreateTransactionActionResult> {
  try {
    await requirePermission("create", "transaction");
    const current = await currentIdentity();
    if (!current) return { ok: false, error: "UNAUTHENTICATED" };

    const raw = Object.fromEntries(formData.entries());
    const parsed = createTransactionSchema.parse(raw);
    const result: CreateTransactionResult = await createTransaction(
      parsed,
      current.actor,
    );
    // Narrow the type based on the `created` property
    if (result.created) {
      const tx = result.transaction;
      revalidatePath("/transactions");
      revalidatePath("/bookings");
      return {
        ok: true,
        id: tx.id,
        created: true,
        idempotent: false,
      };
    }
    // result.created === false, so matchedBy exists
    const tx = result.transaction;
    revalidatePath("/transactions");
    revalidatePath("/bookings");
    return {
      ok: true,
      id: tx.id,
      created: false,
      idempotent: true,
      matchedBy: result.matchedBy,
    };
  } catch (e: unknown) {
    if (e instanceof IdentityError) {
      if (e.code === "UNAUTHENTICATED")
        return { ok: false, error: "UNAUTHENTICATED" };
      if (e.code === "FORBIDDEN_BRANCH")
        return { ok: false, error: "FORBIDDEN_BRANCH" };
    }
    if (e instanceof Error && e.name === "ZodError") {
      return { ok: false, error: "VALIDATION" };
    }
    if (e instanceof Error) {
      if (
        e.message === "IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD" ||
        e.message === "IDEMPOTENCY_CONFLICT_AWB_EXISTS_WITH_DIFFERENT_KEY" ||
        e.message === "AWB_EXISTS_WITH_DIFFERENT_PAYLOAD"
      ) {
        return { ok: false, error: "IDEMPOTENCY_CONFLICT" };
      }
      if (e.message.includes("AWB_ALREADY_USED")) {
        return { ok: false, error: "CONFLICT" };
      }
      if (e.message.includes("CONFLICT") || e.message.includes("P2002")) {
        return { ok: false, error: "CONFLICT" };
      }
    }
    return { ok: false, error: "UNKNOWN" };
  }
}

export async function updateTransactionStatusAction(formData: FormData) {
  await requirePermission("update", "transaction");
  const current = await currentIdentity();
  if (!current) throw new IdentityError("UNAUTHENTICATED", 401);

  const raw = Object.fromEntries(formData.entries());
  const parsed = updateTransactionStatusSchema.parse(raw);
  const result = await updateTransactionStatus(parsed, current.actor);
  revalidatePath("/transactions");
  revalidatePath(`/transactions/${parsed.transactionId}`);
  return { ok: true, id: result?.id };
}
