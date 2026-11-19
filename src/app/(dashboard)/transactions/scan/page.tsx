import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageTabs } from "@/components/patterns/page-tabs";
import { AwbPodScanner } from "@/features/modul/components/awb-pod-scanner";
import { AwbScanner } from "@/features/modul/components/awb-scanner";
import { ModulHeader } from "@/features/modul/components/page-bits";
import { requirePagePermission } from "@/lib/auth/page-access";
import { awbScanEnabled } from "@/lib/features";

export const metadata: Metadata = { title: "Scan AWB" };

// Feature flag and session are read per request.
export const instant = false;

/** Hidden until FEATURE_AWB_SCAN="true"; then needs the "Scan AWB" right. */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!awbScanEnabled()) notFound();
  await requirePagePermission("use", "awb_scan");
  const bulk = (await searchParams).mode === "bulk";
  return (
    <div className="mx-auto min-w-0 max-w-3xl space-y-5">
      <ModulHeader
        title="Scan AWB"
        info={
          bulk
            ? "Scan Massal: pilih status tujuan lalu scan AWB berturut-turut. Setiap scan langsung mengubah status AWB di cabang Anda (riwayat 'Scan AWB')."
            : "Scan barcode/QR AWB dengan scanner genggam, kamera HP (Chrome Android), atau ketik nomor lalu Enter. Lihat data pengirim, penerima dan tracking, lalu Update Status: DITERIMA atau RETUR dengan nama penerima, keterangan, foto 1–5 dan tanda tangan."
        }
      />
      <PageTabs
        label="Mode scan"
        active={bulk ? "bulk" : "pod"}
        tabs={[
          {
            key: "pod",
            label: "Scan & Konfirmasi",
            href: "/transactions/scan",
          },
          {
            key: "bulk",
            label: "Scan Massal",
            href: "/transactions/scan?mode=bulk",
          },
        ]}
      />
      {bulk ? <AwbScanner /> : <AwbPodScanner />}
    </div>
  );
}
