import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Barcode } from "@/components/patterns/barcode";
import { StatusUpdateForm } from "@/features/bookings/components/status-update-form";
import { getTransactionById } from "@/features/bookings/server/queries";
import { permits } from "@/features/identity/permissions";
import { currentIdentity } from "@/features/identity/server/context";
import { AwbChangePanel } from "@/features/modul/components/awb-change-panel";
import { DeliveryProof } from "@/features/shipments/components/delivery-proof";
import { requirePagePermission } from "@/lib/auth/page-access";
import type { TransactionStatusHistory } from "@/lib/db/generated/client";
import { formatRupiah } from "@/lib/format/rupiah";

export const instant = false;

export const metadata: Metadata = { title: "Detail AWB/Transaction" };

const idSchema = z.coerce.number().int().positive();

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePagePermission("view", "transaction");
  const { id } = await params;
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) {
    notFound();
  }
  const parsedId = parsed.data;
  const [tx, current] = await Promise.all([
    getTransactionById(parsedId),
    currentIdentity(),
  ]);
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
            [
              "Pricing Type",
              tx.pricingType === "KOLI"
                ? "Harga/Koli"
                : tx.pricingType === "TRUCKING"
                  ? "Trucking"
                  : tx.pricingType === "KG"
                    ? "Harga/Kg"
                    : null,
            ],
            ["Pickup By", tx.pickupCourier?.name],
            ["Marketing", tx.marketingPerson?.name],
            ["Alamat Pengirim", tx.senderAddress],
            ["No. Telp Pengirim", tx.senderPhone],
            ["Penerima (master)", tx.consignee?.name],
            ["Alamat Penerima", tx.receiverAddress],
            ["No. Telp Penerima", tx.receiverPhone],
            ["Koli", tx.koli],
            ["Berat (kg)", tx.kilo?.toString()],
            ["Volume", tx.volume?.toString()],
            ["Terberat (Kg)", tx.chargeableWeight?.toString()],
            ["Harga", formatRupiah(tx.pricePerKg)],
            ["Min KG", tx.minWeight?.toString()],
            ["Asuransi", tx.insured === null ? null : tx.insured ? "Y" : "N"],
            ["Biaya Lain", formatRupiah(tx.otherFee)],
            ["Biaya Packing", formatRupiah(tx.packingFee)],
            ["Biaya Pickup", formatRupiah(tx.pickupFee)],
            ["Total Biaya", formatRupiah(tx.totalCost)],
            ["Discount (%)", tx.discountPercent?.toString()],
            ["PPN (%)", tx.ppnPercent?.toString()],
            ["Grand Total", formatRupiah(tx.biaya)],
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
      {current && <DeliveryProof actor={current.actor} transactionId={tx.id} />}
      {current && <AwbChangePanel actor={current.actor} transaction={tx} />}
      <div className="border rounded p-4 space-y-3">
        {/* Only groups with "Transaksi: ubah" can change the status here; the
            server action checks the same right. */}
        {current && permits(current.actor, "update", "transaction") && (
          <>
            <h2 className="font-medium">Ubah Status</h2>
            <div>
              <StatusUpdateForm
                transactionId={tx.id}
                currentStatus={tx.status}
              />
            </div>
          </>
        )}
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
