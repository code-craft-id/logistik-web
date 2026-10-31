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

export async function createBookingAction(formData: FormData) {
  await requirePermission("create", "booking");
  const current = await currentIdentity();
  if (!current) throw new IdentityError("UNAUTHENTICATED", 401);

  const raw = Object.fromEntries(formData.entries());
  const parsed = createBookingSchema.parse(raw);
  const result = await createBooking(parsed, current.actor);
  revalidatePath("/bookings");
  return { ok: true, id: result.id };
}

export async function createTransactionAction(formData: FormData) {
  await requirePermission("create", "transaction");
  const current = await currentIdentity();
  if (!current) throw new IdentityError("UNAUTHENTICATED", 401);

  const raw = Object.fromEntries(formData.entries());
  const parsed = createTransactionSchema.parse(raw);
  const result = await createTransaction(parsed, current.actor);
  const tx = (result as any).transaction ? (result as any).transaction : result;
  revalidatePath("/transactions");
  revalidatePath("/bookings");
  return {
    ok: true,
    id: tx.id,
    created: (result as any).created ?? true,
    idempotent: (result as any).idempotent ?? false,
  };
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
