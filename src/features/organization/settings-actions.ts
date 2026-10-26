"use server";
import { revalidatePath } from "next/cache";
import { IdentityError } from "@/features/identity/server/access";
import { identityAction } from "@/features/identity/server/action";
import { currentIdentity } from "@/features/identity/server/context";
import { prisma } from "@/lib/db";
import { createConfigurationService } from "./server/settings-service";

const service = createConfigurationService(
  prisma,
  async () => (await currentIdentity())?.actor ?? null,
);
async function result<T>(work: () => Promise<T>) {
  try {
    return { ok: true as const, data: await identityAction(work) };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof IdentityError
          ? error.code === "DUPLICATE"
            ? "Data dengan identitas tersebut sudah digunakan."
            : error.message
          : "Permintaan tidak dapat diproses.",
    };
  }
}
export async function configurationCapabilities(kind: unknown) {
  return result(() => service.capabilities(kind));
}
export async function listConfigurations(kind: unknown, input: unknown) {
  return result(() => service.list(kind, input));
}
export async function configurationDetail(kind: unknown, id: unknown) {
  return result(() => service.detail(kind, id));
}
export async function configurationChoices(
  kind: unknown,
  type: unknown,
  input: unknown,
) {
  return result(() => service.choices(kind, type, input));
}
export async function saveConfiguration(
  kind: unknown,
  id: unknown,
  input: unknown,
  version?: unknown,
) {
  const response = await result(() => service.save(kind, id, input, version));
  if (response.ok) {
    revalidatePath("/office");
    revalidatePath("/vendor");
  }
  return response;
}
export async function removeConfiguration(kind: unknown, id: unknown) {
  const response = await result(() => service.remove(kind, id));
  if (response.ok) {
    revalidatePath("/office");
    revalidatePath("/vendor");
  }
  return response;
}
