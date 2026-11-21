"use server";

import { revalidatePath } from "next/cache";
import { IdentityError } from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";
import { ModulError } from "@/features/modul/server/common";
import {
  applyStatusRows,
  checkStatusRows,
  type ImportRow,
  parseStatusFile,
  STATUS_IMPORT_MAX_BYTES,
} from "./server/status-import";

export type StatusImportResult =
  | { ok: true; mode: "preview"; rows: ImportRow[] }
  | {
      ok: true;
      mode: "apply";
      rows: (ImportRow & { applied: boolean })[];
    }
  | { ok: false; message: string };

/** Preview (mode=preview) or apply (mode=apply) an import file. */
export async function statusImportAction(
  formData: FormData,
): Promise<StatusImportResult> {
  try {
    const current = await currentIdentity();
    if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
    const file = formData.get("file");
    if (!(file instanceof File)) return { ok: false, message: "Pilih file." };
    if (file.size > STATUS_IMPORT_MAX_BYTES)
      throw new ModulError("File maksimal 2 MB.");
    const parsed = parseStatusFile(
      new Uint8Array(await file.arrayBuffer()),
      file.name,
    );
    if (formData.get("mode") === "apply") {
      const rows = await applyStatusRows(current.actor, parsed);
      revalidatePath("/customer-service/status-pengantaran");
      return { ok: true, mode: "apply", rows };
    }
    return {
      ok: true,
      mode: "preview",
      rows: await checkStatusRows(current.actor, parsed),
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof ModulError
          ? error.message
          : error instanceof IdentityError
            ? error.code === "UNAUTHENTICATED"
              ? "Sesi Anda berakhir. Silakan masuk kembali."
              : "Grup Anda belum punya hak Transaksi: ubah untuk import status."
            : "Import gagal karena kesalahan sistem.",
    };
  }
}
