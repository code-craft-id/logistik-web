import "server-only";
import { currentIdentity } from "@/features/identity/server/context";
import { prisma } from "@/lib/db";
import { createFinanceService } from "./service";

export const financeService = createFinanceService(
  prisma,
  async () => (await currentIdentity())?.actor ?? null,
);
