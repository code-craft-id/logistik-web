import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AwbScanner } from "@/features/modul/components/awb-scanner";
import { ModulHeader } from "@/features/modul/components/page-bits";
import { requirePagePermission } from "@/lib/auth/page-access";
import { awbScanEnabled } from "@/lib/features";

export const metadata: Metadata = { title: "Scan AWB" };

// Feature flag and session are read per request.
export const instant = false;

/** Hidden until FEATURE_AWB_SCAN="true"; then needs the "Scan AWB" right. */
export default async function Page() {
  if (!awbScanEnabled()) notFound();
  await requirePagePermission("use", "awb_scan");
  return (
    <div className="mx-auto min-w-0 max-w-3xl space-y-5">
      <ModulHeader
        title="Scan AWB"
        info="Pilih status tujuan, lalu scan barcode/QR AWB berturut-turut dengan scanner genggam (USB/Bluetooth), kamera HP (Chrome Android), atau ketik nomor lalu Enter. Setiap scan langsung mengubah status AWB di cabang Anda dan tercatat di riwayat status dengan alasan 'Scan AWB'. Perpindahan status yang tidak diizinkan ditolak."
      />
      <AwbScanner />
    </div>
  );
}
