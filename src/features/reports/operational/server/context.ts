import "server-only";
import { currentIdentity } from "@/features/identity/server/context";
import { prisma } from "@/lib/db";
import { createOperationalReportService } from "./service";
export const operationalReportService = createOperationalReportService(
  prisma,
  async () => (await currentIdentity())?.actor ?? null,
);
