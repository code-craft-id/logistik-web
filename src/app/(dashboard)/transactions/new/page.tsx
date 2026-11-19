import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TransactionForm } from "@/features/bookings/components/transaction-form";
import { transactionFormOptions } from "@/features/bookings/server/queries";
import { currentIdentity } from "@/features/identity/server/context";
import { requirePagePermission } from "@/lib/auth/page-access";

// Session-dependent form options; blocking render.
export const instant = false;

export const metadata: Metadata = { title: "Tambah AWB/Transaction" };

export default async function Page() {
  await requirePagePermission("create", "transaction");
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const options = await transactionFormOptions(current.actor);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Transaksi On Site Add
        </h1>
        <p className="text-sm text-muted-foreground">
          Nomor AWB terisi otomatis setelah Asal dipilih dan boleh diubah. Kirim
          ulang form yang sama tidak membuat AWB ganda.
        </p>
      </div>
      <TransactionForm
        options={options}
        today={new Date().toISOString().slice(0, 10)}
      />
    </div>
  );
}
