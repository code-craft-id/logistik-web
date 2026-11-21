import "server-only";
import { currentIdentity } from "@/features/identity/server/context";
import { prisma } from "@/lib/db";
import { createTransactionReportService } from "./service";

export const transactionReportService = createTransactionReportService(
  prisma,
  async () => (await currentIdentity())?.actor ?? null,
);
