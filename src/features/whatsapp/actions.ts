"use server";
import { IdentityError } from "@/features/identity/server/access";
import { identityAction } from "@/features/identity/server/action";
import { currentIdentity } from "@/features/identity/server/context";
import { prisma } from "@/lib/db";
import { createWhatsAppSetupService } from "./server/setup-service";
import { createWhatsAppTemplateService } from "./server/template-service";

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

const templates = createWhatsAppTemplateService(
  prisma,
  async () => (await currentIdentity())?.actor ?? null,
);

async function wrap<T>(work: () => Promise<T>, fallback: string) {
  try {
    return { ok: true as const, data: await identityAction(work) };
  } catch (error) {
    return {
      ok: false as const,
      message: error instanceof IdentityError ? error.message : fallback,
    };
  }
}

export async function getWhatsAppNotificationSettings() {
  return wrap(() => templates.settings(), "Pesan WhatsApp gagal dimuat.");
}

export async function saveWhatsAppTemplate(input: unknown) {
  return wrap(() => templates.save(input), "Pesan WhatsApp gagal disimpan.");
}

export async function listWhatsAppActiveCustomers(input: unknown) {
  return wrap(
    () => templates.activeCustomers(input),
    "Daftar customer gagal dimuat.",
  );
}
