"use server";
import { revalidatePath } from "next/cache";
import { IdentityError } from "@/features/identity/server/access";
import { identityAction } from "@/features/identity/server/action";
import { currentIdentity } from "@/features/identity/server/context";
import {
  CUSTOMER_IMPORT_MAX_BYTES,
  importCustomers,
} from "./server/customer-import";

export async function importCustomersAction(form: FormData) {
  try {
    const result = await identityAction(async () => {
      const current = await currentIdentity();
      if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
      const file = form.get("file");
      if (
        !(file instanceof File) ||
        !/\.xlsx?$/i.test(file.name) ||
        !file.size ||
        file.size > CUSTOMER_IMPORT_MAX_BYTES
      )
        throw new IdentityError(
          "INVALID_IMPORT",
          400,
          "Pilih file .xlsx atau .xls maksimal 2 MB.",
        );
      return importCustomers(
        current.actor,
        new Uint8Array(await file.arrayBuffer()),
      );
    });
    revalidatePath("/marketing");
    return {
      ok: true,
      message: `${result.created} customer dibuat, ${result.updated} diperbarui.`,
    };
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
