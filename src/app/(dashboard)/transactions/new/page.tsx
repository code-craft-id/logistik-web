import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TransactionForm } from "@/features/bookings/components/transaction-form";
import { transactionFormOptions } from "@/features/bookings/server/queries";
import { currentIdentity } from "@/features/identity/server/context";
import { requirePagePermission } from "@/lib/auth/page-access";
import { businessDateString } from "@/lib/date/business-date";

// Session-dependent form options; blocking render.
export const instant = false;

export const metadata: Metadata = { title: "Tambah AWB/Transaction" };

export default async function Page() {
  await requirePagePermission("create", "transaction");
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const options = await transactionFormOptions(current.actor);
  // Asal starts at the user's own branch so the automatic number shows at once.
  const defaultOrigin =
    current.actor.branchIds.find((id) =>
      options.branches.some((b) => b.id === id),
    ) ?? (options.branches.length === 1 ? options.branches[0].id : undefined);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Transaksi On Site Add
        </h1>
        <p className="text-sm text-muted-foreground">
          Asal terisi cabang Anda dan Nomor AWB langsung terisi otomatis (boleh
          diubah). Kirim ulang form yang sama tidak membuat AWB ganda.
        </p>
      </div>
      <TransactionForm
        options={options}
        defaultOrigin={defaultOrigin}
        today={businessDateString()}
      />
    </div>
  );
}
