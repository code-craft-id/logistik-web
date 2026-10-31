import { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/session";
import { getTransactionById } from "@/features/bookings/server/queries";
import { StatusUpdateForm } from "@/features/bookings/components/status-update-form";

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
        <h1 className="text-2xl font-semibold tracking-tight">Detail AWB/Transaction</h1>
        <p className="text-sm text-muted-foreground">AWB No: {tx.awbNo || "-"}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="border rounded p-4 space-y-2">
          <div><span className="font-medium">Tanggal:</span> {tx.transactionDate.toISOString().slice(0, 10)}</div>
          <div><span className="font-medium">DO No:</span> {tx.doNo || "-"}</div>
          <div><span className="font-medium">Pengirim:</span> {tx.senderName || "-"}</div>
          <div><span className="font-medium">Penerima:</span> {tx.receiverName || "-"}</div>
          <div><span className="font-medium">Status:</span> {tx.status}</div>
          <div><span className="font-medium">Koli/Kilo/Volume:</span> {tx.koli ?? 0} / {String(tx.kilo ?? "-")} / {String(tx.volume ?? "-")}</div>
          <div><span className="font-medium">Biaya:</span> {String(tx.biaya ?? "-")}</div>
        </div>
        <div className="border rounded p-4 space-y-2">
          <div><span className="font-medium">Cabang Asal:</span> {tx.originBranchId}</div>
          <div><span className="font-medium">Cabang Tujuan:</span> {tx.destinationBranchId ?? "-"}</div>
          <div><span className="font-medium">Booking ID:</span> {tx.bookingId ?? "-"}</div>
          <div><span className="font-medium">Kurir ID:</span> {tx.courierId ?? "-"}</div>
        </div>
      </div>
      <div className="border rounded p-4 space-y-3">
        <h2 className="font-medium">Ubah Status</h2>
        <div>
          <StatusUpdateForm transactionId={tx.id} currentStatus={tx.status} />
        </div>
        <h2 className="font-medium">Riwayat Status (Immutable)</h2>
        <div className="space-y-1">
          {tx.statusHistory.length === 0 ? <div className="text-sm text-muted-foreground">Belum ada riwayat</div> : tx.statusHistory.map((h: any) => (
            <div key={h.id} className="text-sm">
              {h.changedAt.toISOString().slice(0, 16).replace("T", " ")} | {h.priorStatus || "-"} → {h.newStatus} {h.reason ? `(${h.reason})` : ""} {h.actorId ? `(actor:${h.actorId})` : ""}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
