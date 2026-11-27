import "server-only";

import { redirect } from "next/navigation";
import { activeActor, permits } from "@/features/identity/permissions";
import { currentIdentity } from "@/features/identity/server/context";

/**
 * Page guard: sign-in page when there is no session, the "Akses ditolak"
 * page when the group lacks the right. Server actions keep using
 * requirePermission, whose error they turn into a message.
 */
export async function requirePagePermission(action: string, resource: string) {
  const current = await currentIdentity();
  if (!current || !activeActor(current.actor)) redirect("/login");
  if (!permits(current.actor, action, resource))
    redirect(
      `/akses-ditolak?${new URLSearchParams({ resource, action }).toString()}`,
    );
  return current;
}
