import { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { listTransactions } from "@/features/bookings/server/queries";

export const metadata: Metadata = { title: "On Site Outbound" };

export default async function Page() {
  await requirePermission("view", "transaction");
  const transactions = await listTransactions({ limit: 50 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">On Site Outbound / AWB</h1>
          <p className="text-sm text-muted-foreground">
            Daftar transaksi/AWB. Penomoran AWB mengikuti aturan yang belum terkonfirmasi (D-06) - input opsional.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/transactions/lookup" className="px-3 py-2 border rounded">Lookup AWB</Link>
          <Link href="/transactions/new" className="px-3 py-2 border rounded">Tambah AWB</Link>
        </div>
      </div>
      <div className="border rounded">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">AWB No.</th>
              <th className="text-left p-2">Tanggal</th>
              <th className="text-left p-2">DO No.</th>
              <th className="text-left p-2">Pengirim</th>
              <th className="text-left p-2">Penerima</th>
              <th className="text-left p-2">Cabang Asal</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Koli</th>
              <th className="text-left p-2"></th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr><td colSpan={9} className="p-4 text-center text-muted-foreground">Belum ada data</td></tr>
            ) : transactions.map((t: any) => (
              <tr key={t.id} className="border-b">
                <td className="p-2">{t.awbNo || "-"}</td>
                <td className="p-2">{t.transactionDate.toISOString().slice(0, 10)}</td>
                <td className="p-2">{t.doNo || "-"}</td>
                <td className="p-2">{t.senderName || "-"}</td>
                <td className="p-2">{t.receiverName || "-"}</td>
                <td className="p-2">{t.originBranchId ?? "-"}</td>
                <td className="p-2">{t.status}</td>
                <td className="p-2">{t.koli ?? 0}</td>
                <td className="p-2"><Link href={`/transactions/${t.id}`} className="underline">Detail</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
