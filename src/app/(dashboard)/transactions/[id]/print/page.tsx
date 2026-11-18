import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Barcode } from "@/components/patterns/barcode";
import { PrintButton } from "@/components/patterns/print-button";
import { getTransactionById } from "@/features/bookings/server/queries";
import { requirePermission } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Print AWB" };

// Session-dependent page; blocking render.
export const instant = false;

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("view", "transaction");
  const parsed = z.coerce
    .number()
    .int()
    .positive()
    .safeParse((await params).id);
  if (!parsed.success) notFound();
  const tx = await getTransactionById(parsed.data);
  if (!tx) notFound();
  const rows: [string, string | number | null | undefined][] = [
    ["Tanggal", tx.transactionDate.toISOString().slice(0, 10)],
    ["DO / Reff", tx.doNo],
    ["Asal", tx.originBranch?.name],
    ["Tujuan", tx.destinationBranch?.name],
    ["Customer", tx.customer?.name],
    ["Layanan", tx.deliveryService?.name],
    ["Via Moda", tx.transportMode?.name],
    ["DOC / PAC", tx.goodsType?.name],
    ["Pembayaran", tx.costType?.name],
    ["Koli", tx.koli],
    ["Berat (kg)", tx.kilo?.toString()],
    ["Volume", tx.volume?.toString()],
    ["Isi Barang", tx.description],
    ["Keterangan", tx.remarks],
  ];
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/transactions/${tx.id}`}
          className="inline-flex min-h-11 items-center text-sm text-primary underline underline-offset-4"
        >
          Kembali ke detail AWB
        </Link>
        <PrintButton label="Cetak AWB" />
      </div>
      <article className="space-y-4 rounded-lg border bg-background p-6 print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
          <div>
            <h1 className="text-xl font-semibold">Air Waybill</h1>
            <p className="text-sm">Status: {tx.status}</p>
          </div>
          {tx.awbNo ? (
            <Barcode value={tx.awbNo} className="w-64" />
          ) : (
            <p className="text-sm">AWB tanpa nomor</p>
          )}
        </header>
        <section className="grid gap-4 sm:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold">Pengirim</h2>
            <p>{tx.senderName ?? "-"}</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold">Penerima</h2>
            <p>{tx.receiverName ?? "-"}</p>
          </div>
        </section>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium">{value ?? "-"}</dd>
            </div>
          ))}
        </dl>
        <footer className="grid grid-cols-2 gap-6 pt-8 text-center text-sm">
          <p className="border-t pt-2">Tanda tangan pengirim</p>
          <p className="border-t pt-2">Tanda tangan penerima</p>
        </footer>
      </article>
    </div>
  );
}
