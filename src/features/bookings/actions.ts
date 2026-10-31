"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/session";
import { currentIdentity } from "@/features/identity/server/context";
import {
  createBookingSchema,
  createTransactionSchema,
  updateTransactionStatusSchema,
} from "./schemas";
import { createBooking, createTransaction, updateTransactionStatus } from "./server/service";
import { IdentityError } from "@/features/identity/server/access";

export type CreateBookingActionResult =
  | { ok: true; id: number }
  | { ok: false; error: "UNAUTHENTICATED" | "FORBIDDEN_BRANCH" | "VALIDATION" | "CONFLICT" | "UNKNOWN" };

export type CreateTransactionActionResult =
  | { ok: true; id: number; created: boolean; idempotent: boolean; matchedBy?: string }
  | { ok: false; error: "UNAUTHENTICATED" | "FORBIDDEN_BRANCH" | "VALIDATION" | "CONFLICT" | "IDEMPOTENCY_CONFLICT" | "UNKNOWN" };

export async function createBookingAction(formData: FormData): Promise<CreateBookingActionResult> {
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
      if (e.code === "UNAUTHENTICATED") return { ok: false, error: "UNAUTHENTICATED" };
      if (e.code === "FORBIDDEN_BRANCH") return { ok: false, error: "FORBIDDEN_BRANCH" };
    }
    if ((e as any)?.name === "ZodError") {
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

export async function createTransactionAction(formData: FormData): Promise<CreateTransactionActionResult> {
  try {
    await requirePermission("create", "transaction");
    const current = await currentIdentity();
    if (!current) return { ok: false, error: "UNAUTHENTICATED" };

    const raw = Object.fromEntries(formData.entries());
    const parsed = createTransactionSchema.parse(raw);
    const result = await createTransaction(parsed, current.actor);
    if ((result as any).transaction) {
      const tx = (result as any).transaction;
      revalidatePath("/transactions");
      revalidatePath("/bookings");
      return {
        ok: true,
        id: tx.id,
        created: (result as any).created ?? false,
        idempotent: (result as any).idempotent ?? true,
        matchedBy: (result as any).matchedBy,
      };
    }
    revalidatePath("/transactions");
    revalidatePath("/bookings");
    return { ok: true, id: (result as any).id, created: true, idempotent: false };
  } catch (e: unknown) {
    if (e instanceof IdentityError) {
      if (e.code === "UNAUTHENTICATED") return { ok: false, error: "UNAUTHENTICATED" };
      if (e.code === "FORBIDDEN_BRANCH") return { ok: false, error: "FORBIDDEN_BRANCH" };
    }
    if ((e as any)?.name === "ZodError") {
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
