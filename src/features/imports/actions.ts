"use server";
import { revalidatePath } from "next/cache";
import type { AccessActor } from "@/features/identity/permissions";
import { IdentityError } from "@/features/identity/server/access";
import { identityAction } from "@/features/identity/server/action";
import { currentIdentity } from "@/features/identity/server/context";
import { IMPORT_MAX_BYTES } from "@/lib/excel/import-sheet";
import { importConsignees } from "./server/consignees";
import { importVehicles } from "./server/vehicles";
import { importVendorTariffs } from "./server/vendor-tariffs";

async function run(
  form: FormData,
  path: string,
  work: (actor: AccessActor, bytes: Uint8Array) => Promise<string>,
) {
  try {
    const message = await identityAction(async () => {
      const current = await currentIdentity();
      if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
      const file = form.get("file");
      if (
        !(file instanceof File) ||
        !/\.xlsx?$/i.test(file.name) ||
        !file.size ||
        file.size > IMPORT_MAX_BYTES
      )
        throw new IdentityError(
          "INVALID_IMPORT",
          400,
          "Pilih file .xlsx atau .xls maksimal 2 MB.",
        );
      return work(current.actor, new Uint8Array(await file.arrayBuffer()));
    });
    revalidatePath(path);
    return { ok: true, message };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof IdentityError
          ? error.message
          : "Import tidak dapat diproses.",
    };
  }
}

export async function importConsigneesAction(form: FormData) {
  return run(form, "/marketing", importConsignees);
}
export async function importVehiclesAction(form: FormData) {
  return run(form, "/logistics/vehicles", importVehicles);
}
export async function importVendorTariffsAction(form: FormData) {
  return run(form, "/vendor", importVendorTariffs);
}
