import "server-only";
import { headers } from "next/headers";
import { cache } from "react";
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
// Deduped per request: layout, page and services share one session + actor lookup.
export const currentIdentity = cache(async () =>
  sessionForHeaders(await headers()),
);
export const identityService = createIdentityService(
  prisma,
  async () => (await currentIdentity())?.actor ?? null,
);
