"use server";
import { IdentityError } from "@/features/identity/server/access";
import { identityAction } from "@/features/identity/server/action";
import { currentIdentity } from "@/features/identity/server/context";
import { prisma } from "@/lib/db";
import { createWhatsAppSetupService } from "./server/setup-service";

const service = createWhatsAppSetupService(
  prisma,
  async () => (await currentIdentity())?.actor ?? null,
);

export async function listBranchWhatsAppSetup(input: unknown) {
  try {
    return {
      ok: true as const,
      data: await identityAction(() => service.list(input)),
    };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof IdentityError
          ? error.message
          : "Pengaturan WhatsApp gagal dimuat.",
    };
  }
}
