"use server";
import { revalidatePath } from "next/cache";
import { IdentityError } from "@/features/identity/server/access";
import { identityAction } from "@/features/identity/server/action";
import { currentIdentity } from "@/features/identity/server/context";
import {
  importCustomerTariffs,
  TARIFF_IMPORT_MAX_BYTES,
  tariffPricing,
} from "./server/customer-tariffs";

export async function importCustomerTariffsAction(form: FormData) {
  try {
    const count = await identityAction(async () => {
      const current = await currentIdentity();
      if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
      const file = form.get("file");
      if (
        !(file instanceof File) ||
        !/\.xlsx?$/i.test(file.name) ||
        !file.size ||
        file.size > TARIFF_IMPORT_MAX_BYTES
      )
        throw new IdentityError(
          "INVALID_IMPORT",
          400,
          "Pilih file .xlsx atau .xls maksimal 2 MB.",
        );
      return importCustomerTariffs(
        current.actor,
        tariffPricing(form.get("pricing")),
        new Uint8Array(await file.arrayBuffer()),
      );
    });
    revalidatePath("/marketing/tarif");
    return { ok: true, message: `${count} baris tarif disimpan.` };
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
