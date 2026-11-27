import "server-only";
import { currentIdentity } from "@/features/identity/server/context";
import { prisma } from "@/lib/db";
import { createAwbStatusReportService } from "./service";

export const awbStatusReportService = createAwbStatusReportService(
  prisma,
  async () => (await currentIdentity())?.actor ?? null,
);
