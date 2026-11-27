"use server";
import { revalidatePath } from "next/cache";
import { IdentityError } from "@/features/identity/server/access";
import { identityAction } from "@/features/identity/server/action";
import { currentIdentity } from "@/features/identity/server/context";
import { AWB_IMPORT_MAX_BYTES, importAwbs } from "./server/awb-import";

export async function importAwbsAction(form: FormData) {
  try {
    const result = await identityAction(async () => {
      const current = await currentIdentity();
      if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
      const file = form.get("file");
      if (
        !(file instanceof File) ||
        !/\.xlsx?$/i.test(file.name) ||
        !file.size ||
        file.size > AWB_IMPORT_MAX_BYTES
      )
        throw new IdentityError(
          "INVALID_IMPORT",
          400,
          "Pilih file .xlsx atau .xls maksimal 2 MB.",
        );
      return importAwbs(
        current.actor,
        new Uint8Array(await file.arrayBuffer()),
      );
    });
    revalidatePath("/transactions");
    return {
      ok: result.failed.length === 0,
      message: `${result.created} AWB dibuat.${
        result.failed.length ? ` Gagal: ${result.failed.join(", ")}.` : ""
      }`,
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
