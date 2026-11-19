import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AwbPodScanner } from "@/features/modul/components/awb-pod-scanner";
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
        info="Scan barcode/QR AWB dengan scanner genggam, kamera HP (Chrome Android), atau ketik nomor lalu Enter. Lihat data pengirim, penerima dan tracking, lalu Update Status: DITERIMA atau RETUR dengan nama penerima, keterangan, foto 1–5 dan tanda tangan."
      />
      <AwbPodScanner />
    </div>
  );
}
