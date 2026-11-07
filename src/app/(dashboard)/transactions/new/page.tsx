import { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { TransactionForm } from "@/features/bookings/components/transaction-form";

export const metadata: Metadata = { title: "Tambah AWB/Transaction" };

export default async function Page() {
  await requirePermission("create", "transaction");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tambah AWB / On Site Outbound</h1>
        <p className="text-sm text-muted-foreground">
          Input transaksi/AWB. Idempotensi diterapkan via kunci permintaan; relasi booking bersifat opsional (D-05 belum terkonfirmasi).
        </p>
      </div>
      <TransactionForm />
    </div>
  );
}
