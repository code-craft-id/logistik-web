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

export async function getUserGroups(input: unknown = {}) {
  const result = await identityAction(() =>
    identityService.getUserGroups(input),
  );
  return result;
}

export async function getUserGroupById(id: unknown) {
  const result = await identityAction(() =>
    identityService.getUserGroupById(id),
  );
  return result;
}

export async function createUserGroup(input: unknown) {
  const result = await identityAction(() =>
    identityService.createUserGroup(input),
  );
  invalidateIdentity();
  return result;
}

export async function updateUserGroup(id: unknown, input: unknown) {
  const result = await identityAction(() =>
    identityService.updateUserGroup(id, input),
  );
  invalidateIdentity();
  return result;
}

export async function deleteUserGroup(id: unknown) {
  const result = await identityAction(() =>
    identityService.deleteUserGroup(id),
  );
  invalidateIdentity();
  return result;
}

export async function getGroupPermissions(groupId: unknown) {
  return (await identityAction(() => identityService.getUserGroupById(groupId)))
    .permissions;
}
export async function assignPermissionToGroup(
  groupId: unknown,
  action: string,
  resource: string,
) {
  const result = await identityAction(() =>
    identityService.assignPermission(groupId, action, resource),
  );
  invalidateIdentity();
  return result;
}
export async function removePermissionFromGroup(permissionId: unknown) {
  const result = await identityAction(() =>
    identityService.removePermission(permissionId),
  );
  invalidateIdentity();
  return result;
}
