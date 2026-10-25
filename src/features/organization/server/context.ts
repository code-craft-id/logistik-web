import "server-only";
import { currentIdentity } from "@/features/identity/server/context";
import { prisma } from "@/lib/db";
import { createOrganizationService } from "./service";
export const organizationService = createOrganizationService(
  prisma,
  async () => (await currentIdentity())?.actor ?? null,
);
