"use server";

import { revalidatePath } from "next/cache";
import { IdentityError } from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";
import { requirePermission } from "@/lib/auth/session";
import {
  assignToManifestSchema,
  createManifestSchema,
  deliveryOutcomeSchema,
} from "./manifests-schemas";
import {
  assignTransactionToManifest,
  createManifest,
  recordDeliveryOutcome,
} from "./server/manifests-service";

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
  if (!result) throw new IdentityError("DELIVERY_OUTCOME_NOT_FOUND", 404);
  return { ok: true, id: result.id };
}
