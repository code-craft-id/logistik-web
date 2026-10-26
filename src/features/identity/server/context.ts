import "server-only";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { activeActor } from "../permissions";
import { loadAccessActor } from "./access";
import { createIdentityService } from "./service";

export async function sessionForHeaders(requestHeaders: Headers) {
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session?.user) return null;
  const userId = Number(session.user.id);
  if (!Number.isSafeInteger(userId) || userId <= 0) return null;
  const actor = await loadAccessActor(prisma, userId);
  return activeActor(actor) ? { session, actor } : null;
}
export async function currentIdentity() {
  return sessionForHeaders(await headers());
}
export const identityService = createIdentityService(
  prisma,
  async () => (await currentIdentity())?.actor ?? null,
);
