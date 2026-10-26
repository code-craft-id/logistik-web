"use server";
import { revalidatePath } from "next/cache";
import { IdentityError } from "@/features/identity/server/access";
import { identityAction } from "@/features/identity/server/action";
import { masterDataService } from "./server/context";

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
export async function listMasterData(kind: unknown, input: unknown) {
  return result(() => masterDataService.list(kind, input));
}
export async function masterDataDetail(kind: unknown, id: unknown) {
  return result(() => masterDataService.detail(kind, id));
}
export async function masterDataChoices(
  kind: unknown,
  type: unknown,
  input: unknown,
) {
  return result(() => masterDataService.choices(kind, type, input));
}
function invalidate() {
  for (const path of [
    "/logistics/areas",
    "/logistics/services",
    "/logistics/vehicles",
    "/logistics/division",
    "/vendor",
    "/vendor/services",
    "/shipment-status",
  ])
    revalidatePath(path);
}
export async function saveMasterData(
  kind: unknown,
  id: unknown,
  input: unknown,
  version: unknown = undefined,
) {
  const response = await result(() =>
    masterDataService.save(kind, id, input, version),
  );
  if (response.ok) invalidate();
  return response;
}
export async function removeMasterData(kind: unknown, id: unknown) {
  const response = await result(() => masterDataService.remove(kind, id));
  if (response.ok) invalidate();
  return response;
}
