import "server-only";
import { prisma } from "@/lib/db";
import { currentIdentity } from "./context";
import { createProfileService } from "./profile-service";

export const profileService = createProfileService(prisma, async () => {
  const current = await currentIdentity();
  if (!current) return null;
  const sessionId = Number(current.session.session.id);
  if (!Number.isSafeInteger(sessionId) || sessionId <= 0) return null;
  return {
    userId: current.actor.id,
    sessionId,
    sessionToken: current.session.session.token,
  };
});
