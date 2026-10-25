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

export async function getUsers(input: unknown = {}) {
  const result = await identityAction(() => identityService.getUsers(input));
  return result;
}

export async function getUserById(id: unknown) {
  const result = await identityAction(() => identityService.getUserById(id));
  return result;
}

export async function createUser(input: unknown) {
  const result = await identityAction(() => identityService.createUser(input));
  invalidateIdentity();
  return result;
}

export async function updateUser(id: unknown, input: unknown) {
  const result = await identityAction(() =>
    identityService.updateUser(id, input),
  );
  invalidateIdentity();
  return result;
}

export async function deleteUser(id: unknown) {
  const result = await identityAction(() => identityService.deleteUser(id));
  invalidateIdentity();
  return result;
}

export async function getBranchesForAssignment(input: unknown = {}) {
  const result = await identityAction(() =>
    identityService.getBranchesForAssignment(input),
  );
  return result;
}

export async function getGroupsForAssignment(input: unknown = {}) {
  const result = await identityAction(() =>
    identityService.getGroupsForAssignment(input),
  );
  return result;
}
