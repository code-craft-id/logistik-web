"use server";

import { IdentityError } from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";
import { awbScanEnabled } from "@/lib/features";
import { type ScanResult, scanAwb } from "./server/scan";

export async function scanAwbAction(input: {
  awbNo: string;
  status: string;
}): Promise<ScanResult> {
  const awbNo = String(input?.awbNo ?? "").slice(0, 60);
  if (!awbScanEnabled())
    return { ok: false, awbNo, message: "Fitur Scan AWB belum diaktifkan." };
  try {
    const current = await currentIdentity();
    if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
    return await scanAwb(current.actor, input);
  } catch (e) {
    return {
      ok: false,
      awbNo,
      message:
        e instanceof IdentityError && e.code === "UNAUTHENTICATED"
          ? "Sesi Anda berakhir. Silakan masuk kembali."
          : e instanceof IdentityError
            ? "Grup Anda belum memiliki hak Scan AWB. Minta admin menambahkannya di Hak Akses Menu."
            : "Scan gagal karena kesalahan sistem. Coba lagi.",
    };
  }
}
