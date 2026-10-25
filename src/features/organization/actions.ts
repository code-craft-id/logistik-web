"use server";
import { revalidatePath } from "next/cache";
import { IdentityError } from "@/features/identity/server/access";
import { identityAction } from "@/features/identity/server/action";
import { organizationService } from "./server/context";

async function result<T>(work: () => Promise<T>) {
  try {
    return { ok: true as const, data: await identityAction(work) };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof IdentityError
          ? error.code === "DUPLICATE"
            ? "Data dengan identitas tersebut sudah digunakan."
            : error.message
          : "Permintaan tidak dapat diproses.",
    };
  }
}
export async function listOrganizations(kind: unknown, query: unknown) {
  return result(() => organizationService.list(kind, query));
}
export async function saveOrganization(
  kind: unknown,
  id: unknown,
  input: unknown,
  version: unknown = undefined,
) {
  const response = await result(() =>
    organizationService.save(kind, id, input, version),
  );
  if (response.ok) {
    revalidatePath("/office");
    revalidatePath("/user-management");
  }
  return response;
}
export async function removeOrganization(kind: unknown, id: unknown) {
  const response = await result(() => organizationService.remove(kind, id));
  if (response.ok) revalidatePath("/office");
  return response;
}
