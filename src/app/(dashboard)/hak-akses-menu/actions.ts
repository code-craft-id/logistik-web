"use server";
import { revalidatePath } from "next/cache";
import { identityAction } from "@/features/identity/server/action";
import { identityService } from "@/features/identity/server/context";

function invalidateIdentity() {
  for (const path of [
    "/group-user",
    "/user-management",
    "/hak-akses-menu",
    "/profile",
  ])
    revalidatePath(path);
}

export async function getPermissionMatrix(input: unknown = {}) {
  const result = await identityAction(() =>
    identityService.getPermissionMatrix(input),
  );
  return result;
}

export async function updatePermissionMatrix(input: unknown) {
  const result = await identityAction(() =>
    identityService.updatePermissionMatrix(input),
  );
  invalidateIdentity();
  return result;
}
