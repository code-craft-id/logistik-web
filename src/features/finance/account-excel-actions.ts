"use server";
import { revalidatePath } from "next/cache";
import { IdentityError } from "@/features/identity/server/access";
import { identityAction } from "@/features/identity/server/action";
import { currentIdentity } from "@/features/identity/server/context";
import {
  ACCOUNT_IMPORT_MAX_BYTES,
  importAccounts,
} from "./server/account-excel";

/** Perkiraan Import Data: .xlsx / .xls up to 1 MB, all rows or none. */
export async function importAccountsAction(form: FormData) {
  try {
    const result = await identityAction(async () => {
      const current = await currentIdentity();
      if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
      const file = form.get("file");
      if (
        !(file instanceof File) ||
        !/\.xlsx?$/i.test(file.name) ||
        !file.size ||
        file.size > ACCOUNT_IMPORT_MAX_BYTES
      )
        throw new IdentityError(
          "INVALID_IMPORT",
          400,
          "Pilih file .xlsx atau .xls maksimal 1 MB.",
        );
      return importAccounts(
        current.actor,
        new Uint8Array(await file.arrayBuffer()),
      );
    });
    revalidatePath("/akunting/data-akun");
    return {
      ok: true as const,
      message: `${result.created} akun baru, ${result.updated} akun diperbarui.`,
    };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof IdentityError
          ? error.message
          : "Import tidak dapat diproses.",
    };
  }
}
