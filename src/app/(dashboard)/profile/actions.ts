"use server";

import { revalidatePath } from "next/cache";
import { identityAction } from "@/features/identity/server/action";
import { profileService } from "@/features/identity/server/profile-context";

export async function getProfile() {
  return identityAction(() => profileService.getProfile());
}
export async function updateProfile(input: unknown) {
  const result = await identityAction(() =>
    profileService.updateProfile(input),
  );
  revalidatePath("/", "layout");
  return result;
}
export async function changePassword(input: unknown) {
  return identityAction(() => profileService.changePassword(input));
}
export async function getUserSessions(input: unknown = {}) {
  return identityAction(() => profileService.getSessions(input));
}
export async function revokeSession(id: unknown) {
  return identityAction(() => profileService.revokeSession(id));
}
// The current session comes from the authenticated request, never client input.
export async function revokeAllOtherSessions() {
  return identityAction(() =>
    profileService.revokeSessions({ scope: "others" }),
  );
}
export async function revokeAllSessions() {
  return identityAction(() => profileService.revokeSessions({ scope: "all" }));
}
