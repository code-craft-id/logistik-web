import "server-only";
import { currentIdentity } from "@/features/identity/server/context";
import { prisma } from "@/lib/db";
import { createTicketService } from "./service";

export const ticketService = createTicketService(
  prisma,
  async () => (await currentIdentity())?.actor ?? null,
);
