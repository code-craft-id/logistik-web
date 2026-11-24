import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TransactionForm } from "@/features/bookings/components/transaction-form";
import { transactionFormOptions } from "@/features/bookings/server/queries";
import { currentIdentity } from "@/features/identity/server/context";
import { agentChoices } from "@/features/organization/server/agent-deposit";
import { requirePagePermission } from "@/lib/auth/page-access";
import { businessDateString } from "@/lib/date/business-date";

// Session-dependent form options; blocking render.
export const instant = false;

export const metadata: Metadata = { title: "Tambah AWB/Transaction" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePagePermission("create", "transaction");
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const agentMode = (await searchParams).agent === "1";
  const [base, agents] = await Promise.all([
    transactionFormOptions(current.actor),
    agentMode ? agentChoices(current.actor) : Promise.resolve(null),
  ]);
  // On Site Agent: only active agents; the label shows deposit and commission.
  const options = agents
    ? {
        ...base,
        agents: agents
          .filter((a) => a.status === "ACTIVE")
          .map((a) => ({
            id: a.id,
            name: `${a.name} (saldo Rp ${a.balance.toFixed(0)}, komisi ${a.commissionRate.toString()}%)`,
          })),
      }
    : base;
  // Asal starts at the user's own branch so the automatic number shows at once.
  const defaultOrigin =
    current.actor.branchIds.find((id) =>
      options.branches.some((b) => b.id === id),
    ) ?? (options.branches.length === 1 ? options.branches[0].id : undefined);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {agentMode ? "On Site Add Agent" : "Transaksi On Site Add"}
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
