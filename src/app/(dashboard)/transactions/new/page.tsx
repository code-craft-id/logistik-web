import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TransactionForm } from "@/features/bookings/components/transaction-form";
import { transactionFormOptions } from "@/features/bookings/server/queries";
import { currentIdentity } from "@/features/identity/server/context";
import { requirePermission } from "@/lib/auth/session";

// Session-dependent form options; blocking render.
export const instant = false;

export const metadata: Metadata = { title: "Tambah AWB/Transaction" };

export default async function Page() {
  await requirePermission("create", "transaction");
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const options = await transactionFormOptions(current.actor);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Tambah AWB / On Site Outbound
        </h1>
        <p className="text-sm text-muted-foreground">
          Input transaksi/AWB. Idempotensi diterapkan via kunci permintaan;
          relasi booking bersifat opsional (D-05 belum terkonfirmasi).
        </p>
      </div>
      <TransactionForm options={options} />
    </div>
  );
}
