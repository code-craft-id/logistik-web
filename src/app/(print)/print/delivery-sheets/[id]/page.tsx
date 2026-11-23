import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PrintToolbar } from "@/components/patterns/auto-print";
import { Barcode } from "@/components/patterns/barcode";
import { QrCode } from "@/components/patterns/qr-code";
import { currentIdentity } from "@/features/identity/server/context";
import { getStandaloneDeliverySheet } from "@/features/shipments/server/delivery-sheets";
import { requirePagePermission } from "@/lib/auth/page-access";
import { formatRupiah } from "@/lib/format/rupiah";

export const metadata: Metadata = { title: "Print DRS" };

// Session-dependent document; blocking render.
export const instant = false;

const OUTCOME: Record<string, string> = {
  DELIVERED: "Terkirim",
  FAILED_DELIVERY: "Gagal",
  RETURNED: "Retur",
};

/** Printable standalone DRS (Kurir Kota): one sheet, AWB rows to sign. */
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePagePermission("view", "delivery");
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const sheet = await getStandaloneDeliverySheet(
    current.actor,
    Number((await params).id),
  );
  if (!sheet) notFound();
  return (
    <>
      <PrintToolbar label="Cetak DRS" count={1} />
      <main className="p-4 print:p-0">
        <article className="mx-auto max-w-4xl space-y-4 border border-black p-6 print:border-0 print:p-0">
          <header className="flex items-start justify-between gap-4 border-b pb-4">
            <div className="space-y-1">
              <h1 className="text-xl font-semibold">
                Lembar Pengantaran {sheet.sheetNo}
              </h1>
              <p className="text-sm">
                Tanggal {sheet.date} · Cabang {sheet.branch?.name ?? "-"}
                {sheet.agent ? ` · Agen ${sheet.agent.name}` : ""}
              </p>
              <p className="text-sm">
                Kurir {sheet.courier?.name ?? "-"} · Driver{" "}
                {sheet.driver?.name ?? "-"} · Nopol{" "}
                {sheet.vehicle?.licensePlate ?? "-"}
              </p>
              {sheet.remarks && (
                <p className="text-sm">Keterangan: {sheet.remarks}</p>
              )}
            </div>
            <div className="flex items-end gap-3">
              <Barcode value={sheet.sheetNo} className="w-56" />
              <QrCode value={sheet.sheetNo} size={80} />
            </div>
          </header>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-1 pr-2">No.</th>
                <th className="py-1 pr-2">AWB No.</th>
                <th className="py-1 pr-2">Penerima / Alamat</th>
                <th className="py-1 pr-2 text-right">Koli</th>
                <th className="py-1 pr-2 text-right">Kg</th>
                <th className="py-1 pr-2 text-right">COD (Rp)</th>
                <th className="py-1 pr-2">Hasil / TTD penerima</th>
              </tr>
            </thead>
            <tbody>
              {sheet.items.map((item, index) => (
                <tr key={item.id} className="border-b align-top">
                  <td className="py-2 pr-2">{index + 1}</td>
                  <td className="py-2 pr-2">{item.transaction.awbNo ?? "-"}</td>
                  <td className="py-2 pr-2">
                    <p>{item.transaction.receiverName ?? "-"}</p>
                    <p className="text-xs">
                      {[
                        item.transaction.receiverAddress,
                        item.transaction.receiverPhone,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </td>
                  <td className="py-2 pr-2 text-right">
                    {item.transaction.koli ?? "-"}
                  </td>
                  <td className="py-2 pr-2 text-right">
                    {item.transaction.kilo?.toString() ?? "-"}
                  </td>
                  <td className="py-2 pr-2 text-right">
                    {item.transaction.codValue
                      ? formatRupiah(item.transaction.codValue, {
                          prefix: false,
                        })
                      : "-"}
                  </td>
                  <td className="py-2 pr-2">
                    {item.outcome
                      ? (OUTCOME[item.outcome] ?? item.outcome)
                      : ""}
                    <span className="mt-6 block border-b" />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td className="py-2 pr-2" colSpan={3}>
                  Total {sheet.totals.awb} AWB
                </td>
                <td className="py-2 pr-2 text-right">{sheet.totals.koli}</td>
                <td className="py-2 pr-2 text-right">{sheet.totals.kilo}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
          <footer className="grid grid-cols-2 gap-6 pt-8 text-center text-sm">
            <p className="border-t pt-2">Kurir</p>
            <p className="border-t pt-2">Admin</p>
          </footer>
        </article>
      </main>
    </>
  );
}
