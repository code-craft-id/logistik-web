import "server-only";
import { currentIdentity } from "@/features/identity/server/context";
import { prisma } from "@/lib/db";
import { createWhatsAppConnectionService } from "./connection-service";

export const whatsappConnectionService = createWhatsAppConnectionService(
  prisma,
  async () => (await currentIdentity())?.actor ?? null,
);
