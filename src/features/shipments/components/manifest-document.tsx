import { Barcode } from "@/components/patterns/barcode";
import { QrCode } from "@/components/patterns/qr-code";
import type { getManifest } from "@/features/shipments/server/manifests-queries";

type Manifest = NonNullable<Awaited<ReturnType<typeof getManifest>>>;

const outcomeLabel: Record<string, string> = {
  DELIVERED: "Terkirim",
  FAILED_DELIVERY: "Gagal",
  RETURNED: "Retur",
};

/** One printable manifest (or its DRS with drs=true), one page per document. */
export function ManifestDocument({
  manifest,
  drs,
}: {
  manifest: Manifest;
  drs: boolean;
}) {
  return (
    <article className="mx-auto max-w-4xl space-y-4 border border-black p-6 print:break-after-page print:border-0 print:p-0 print:last:break-after-auto">
      <header className="flex items-start justify-between gap-4 border-b pb-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">
            {drs
              ? `Lembar Pengantaran ${manifest.deliverySheet?.sheetNo}`
              : `Manifest ${manifest.manifestNo}`}
          </h1>
          <p className="text-sm">
            {drs
              ? `Tanggal antar ${manifest.deliverySheet?.date} · Manifest ${manifest.manifestNo}`
              : `Tanggal ${manifest.date} · ${manifest.origin ?? "-"} → ${manifest.destination ?? "-"}`}
          </p>
          <p className="text-sm">
            Kendaraan {manifest.vehicle ?? "-"} · Kurir{" "}
            {manifest.courier ?? "-"}
            {manifest.vendor ? ` · Vendor ${manifest.vendor}` : ""}
          </p>
        </div>
        {/* Barcode and QR carry the DRS or manifest number for scanning. */}
        <div className="flex items-end gap-3">
          <Barcode
            value={
              drs
                ? (manifest.deliverySheet?.sheetNo ?? manifest.manifestNo)
                : manifest.manifestNo
            }
            className="w-56"
          />
          <QrCode
            value={
              drs
                ? (manifest.deliverySheet?.sheetNo ?? manifest.manifestNo)
                : manifest.manifestNo
            }
            size={80}
          />
        </div>
      </header>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-1 pr-2">No.</th>
            <th className="py-1 pr-2">AWB No.</th>
            <th className="py-1 pr-2">Penerima</th>
            <th className="py-1 pr-2">Tujuan</th>
            <th className="py-1 pr-2 text-right">Koli</th>
            <th className="py-1 pr-2 text-right">Berat</th>
            {drs && <th className="py-1 pr-2">Hasil / TTD penerima</th>}
          </tr>
        </thead>
        <tbody>
          {manifest.items.map((item, index) => (
            <tr key={item.id} className="border-b align-top">
              <td className="py-2 pr-2">{index + 1}</td>
              <td className="py-2 pr-2">{item.awbNo ?? "-"}</td>
              <td className="py-2 pr-2">{item.receiver ?? "-"}</td>
              <td className="py-2 pr-2">{item.destination ?? "-"}</td>
              <td className="py-2 pr-2 text-right">{item.koli ?? "-"}</td>
              <td className="py-2 pr-2 text-right">{item.kilo ?? "-"}</td>
              {drs && (
                <td className="py-2 pr-2">
                  {item.outcome
                    ? (outcomeLabel[item.outcome] ?? item.outcome)
                    : ""}
                  <span className="mt-6 block border-b" />
                </td>
              )}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-semibold">
            <td className="py-2 pr-2" colSpan={4}>
              Total {manifest.awb} AWB
            </td>
            <td className="py-2 pr-2 text-right">{manifest.koli ?? "-"}</td>
            <td className="py-2 pr-2 text-right">{manifest.kilo ?? "-"}</td>
            {drs && <td />}
          </tr>
        </tfoot>
      </table>
      <footer className="grid grid-cols-2 gap-6 pt-8 text-center text-sm">
        <p className="border-t pt-2">{drs ? "Kurir" : "Petugas gudang"}</p>
        <p className="border-t pt-2">{drs ? "Admin" : "Pengemudi"}</p>
      </footer>
    </article>
  );
}
