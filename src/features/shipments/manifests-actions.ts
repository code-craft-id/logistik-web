"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/session";
import { currentIdentity } from "@/features/identity/server/context";
import { IdentityError } from "@/features/identity/server/access";
import { createManifestSchema, assignToManifestSchema, deliveryOutcomeSchema } from "./manifests-schemas";
import { assignTransactionToManifest, createManifest, recordDeliveryOutcome } from "./server/manifests-service";

export async function createManifestAction(formData: FormData) {
  await requirePermission("create", "manifest");
  const current = await currentIdentity();
  if (!current) throw new IdentityError("UNAUTHENTICATED", 401);

  const raw = Object.fromEntries(formData.entries());
  const parsed = createManifestSchema.parse(raw);
  const result = await createManifest(parsed, current.actor);
  revalidatePath("/manifest");
  return { ok: true, id: result.id };
}

export async function assignToManifestAction(formData: FormData) {
  await requirePermission("update", "manifest");
  const current = await currentIdentity();
  if (!current) throw new IdentityError("UNAUTHENTICATED", 401);

  const raw = Object.fromEntries(formData.entries());
  const parsed = assignToManifestSchema.parse(raw);
  const result = await assignTransactionToManifest(parsed, current.actor);
  revalidatePath("/manifest");
  return { ok: true, id: result.id };
}

export async function deliveryOutcomeAction(formData: FormData) {
  await requirePermission("update", "delivery");
  const current = await currentIdentity();
  if (!current) throw new IdentityError("UNAUTHENTICATED", 401);

  const raw = Object.fromEntries(formData.entries());
  const parsed = deliveryOutcomeSchema.parse(raw);
  const result = await recordDeliveryOutcome(parsed, current.actor);
  revalidatePath("/manifest");
  revalidatePath("/operations");
  return { ok: true, id: result.id };
}
