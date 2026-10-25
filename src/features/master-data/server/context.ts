import "server-only";
import { currentIdentity } from "@/features/identity/server/context";
import { prisma } from "@/lib/db";
import { createMasterDataService } from "./service";
export const masterDataService = createMasterDataService(
  prisma,
  async () => (await currentIdentity())?.actor ?? null,
);
