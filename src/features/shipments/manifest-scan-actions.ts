"use server";

import { revalidatePath } from "next/cache";
import { IdentityError } from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";
import { ModulError } from "@/features/modul/server/common";
import {
  moveToManifest,
  type ScanKind,
  scanKoli,
} from "./server/manifest-scan";

export async function scanKoliAction(
  manifestId: number,
  kind: ScanKind,
  code: string,
): Promise<{ ok: true; message: string } | { ok: false; message: string }> {
  try {
    const current = await currentIdentity();
    if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
    if (kind !== "TRANSIT" && kind !== "INBOUND")
      return { ok: false, message: "Jenis scan tidak valid." };
    const r = await scanKoli(
      current.actor,
      Number(manifestId),
      kind,
      String(code ?? ""),
    );
    revalidatePath(`/manifest/${manifestId}/scan`);
    return {
      ok: true,
      message: `${r.awbNo}-${r.piece} tercatat (${r.scanned}/${r.koli} koli).`,
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
              : "Grup Anda belum punya hak Manifest: ubah untuk scan."
            : "Scan gagal karena kesalahan sistem.",
    };
  }
}

/** Pindah Manifest: move the ticked scanned AWBs to the chosen manifest. */
export async function moveToManifestAction(
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  try {
    const current = await currentIdentity();
    if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
    const manifestId = Number(formData.get("manifestId"));
    const kind = formData.get("kind") === "INBOUND" ? "INBOUND" : "TRANSIT";
    const r = await moveToManifest(
      current.actor,
      manifestId,
      kind,
      Number(formData.get("targetManifestId")),
      formData.getAll("transactionId").map(Number),
    );
    revalidatePath(`/manifest/${manifestId}/scan`);
    return {
      ok: true,
      message: `${r.moved} AWB dipindah ke manifest ${r.target}.`,
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
              : "Grup Anda belum punya hak Manifest: ubah untuk pindah manifest."
            : "Pindah manifest gagal karena kesalahan sistem.",
    };
  }
}
