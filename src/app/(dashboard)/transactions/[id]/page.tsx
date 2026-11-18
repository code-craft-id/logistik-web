import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Barcode } from "@/components/patterns/barcode";
import { StatusUpdateForm } from "@/features/bookings/components/status-update-form";
import { getTransactionById } from "@/features/bookings/server/queries";
import { requirePermission } from "@/lib/auth/session";
import type { TransactionStatusHistory } from "@/lib/db/generated/client";

export const instant = false;

export const metadata: Metadata = { title: "Detail AWB/Transaction" };

const idSchema = z.coerce.number().int().positive();

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("view", "transaction");
  const { id } = await params;
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) {
    notFound();
  }
  const parsedId = parsed.data;
  const tx = await getTransactionById(parsedId);
  if (!tx) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Detail AWB/Transaction
        </h1>
        <p className="text-sm text-muted-foreground">
          AWB No: {tx.awbNo || "-"}
        </p>
      </div>
      {tx.awbNo && <Barcode value={tx.awbNo} />}
      <a
        href={`/print/awb?ids=${tx.id}`}
        target="_blank"
        rel="noopener"
        className="inline-flex min-h-11 items-center text-sm text-primary underline underline-offset-4"
      >
        Print AWB
      </a>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 rounded border p-4 sm:grid-cols-2 lg:grid-cols-3">
        {(
          [
            ["Tanggal", tx.transactionDate.toISOString().slice(0, 10)],
            ["DO No.", tx.doNo],
            ["Status", tx.status],
            ["Asal", tx.originBranch?.name],
            ["Tujuan", tx.destinationBranch?.name],
            ["Customer", tx.customer?.name],
            ["Pengirim", tx.senderName],
            ["Penerima", tx.receiverName],
            ["Layanan", tx.deliveryService?.name],
            ["DOC / PAC", tx.goodsType?.name],
            ["Via Moda", tx.transportMode?.name],
            ["Pembayaran", tx.costType?.name],
            ["Koli", tx.koli],
            ["Berat (kg)", tx.kilo?.toString()],
            ["Volume", tx.volume?.toString()],
            ["Biaya (Rp.)", tx.biaya?.toString()],
            ["Isi Barang", tx.description],
            ["Keterangan", tx.remarks],
            ["Kurir", tx.courier?.name],
            ["Booking", tx.booking?.bookingNo ?? tx.bookingId],
            ["Dibuat oleh", tx.createdBy?.name],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="font-medium [overflow-wrap:anywhere]">
              {value ?? "-"}
            </dd>
          </div>
        ))}
      </dl>
      <div className="border rounded p-4 space-y-3">
        <h2 className="font-medium">Ubah Status</h2>
        <div>
          <StatusUpdateForm transactionId={tx.id} currentStatus={tx.status} />
        </div>
        <h2 className="font-medium">Riwayat Status (Immutable)</h2>
        <div className="space-y-1">
          {tx.statusHistory.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Belum ada riwayat
            </div>
          ) : (
            tx.statusHistory.map((h: TransactionStatusHistory) => (
              <div key={h.id} className="text-sm">
                {h.changedAt.toISOString().slice(0, 16).replace("T", " ")} |{" "}
                {h.priorStatus || "-"} → {h.newStatus}{" "}
                {h.reason ? `(${h.reason})` : ""}{" "}
                {h.actorId ? `(actor:${h.actorId})` : ""}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
