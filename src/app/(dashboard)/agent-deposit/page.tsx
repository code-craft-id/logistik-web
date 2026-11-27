import type { Metadata } from "next";
import Form from "next/form";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/patterns/content-state";
import { FormDialog } from "@/components/patterns/form-dialog";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/ui/money-input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { permits } from "@/features/identity/permissions";
import { currentIdentity } from "@/features/identity/server/context";
import { topUpAgentAction } from "@/features/modul/actions";
import {
  ModulHeader,
  one,
  rupiah,
  selectClass,
} from "@/features/modul/components/page-bits";
import { depositHistory } from "@/features/organization/server/agent-deposit";
import { businessDateTimeString } from "@/lib/date/business-date";

export const metadata: Metadata = { title: "History Deposit Agent" };

// Session- and query-dependent page; blocking render.
export const instant = false;

const KIND: Record<string, string> = {
  TOPUP: "Debit Saldo",
  AWB: "Pemakaian AWB",
  VOID: "Pengembalian Void",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const current = await currentIdentity();
  if (!current) redirect("/login");
  if (!permits(current.actor, "view", "agent"))
    return (
      <EmptyState
        title="Akses ditolak"
        description="Grup Anda belum memiliki hak lihat Agen. Minta admin menambahkannya di Hak Akses Menu."
      />
    );
  const query = await searchParams;
  const requested = Number(one(query.agentId));
  const { agents, agent, rows } = await depositHistory(
    current.actor,
    Number.isInteger(requested) ? requested : null,
  );
  const canTopUp = permits(current.actor, "update", "agent");
  return (
    <div className="min-w-0 space-y-5">
      <ModulHeader
        title={`History Pemakaian Deposit Agent${agent ? ` - ${agent.name}` : ""}`}
        info="Semua perubahan saldo deposit agen: Debit Saldo (isi deposit oleh admin), Pemakaian AWB (Grand Total dikurangi komisi agen) dan Pengembalian Void. Saldo Akhir = Saldo Sebelumnya + Jumlah + Komisi Agent."
      />
      <Form
        action="/agent-deposit"
        className="flex flex-wrap items-end gap-3 rounded-lg border bg-background p-4"
      >
        <label className="grid min-w-64 gap-1 text-sm font-medium">
          Agen
          <select
            name="agentId"
            defaultValue={agent?.id ?? ""}
            className={selectClass}
          >
            <option value="">Pilih Agent…</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" variant="outline" className="min-h-11">
          Tampilkan
        </Button>
      </Form>
      {agent && (
        <section className="grid gap-4 rounded-lg border bg-background p-4 sm:grid-cols-[1fr_auto]">
          <p className="text-lg font-semibold">
            Saldo Akhir: Rp {rupiah(agent.balance.toString())}
            <span className="block text-sm font-normal text-muted-foreground">
              Komisi {agent.commissionRate.toString()}% dari Grand Total AWB
            </span>
          </p>
          {canTopUp && (
            <div>
              <FormDialog
                trigger="Debit Saldo"
                title={`Debit Saldo ${agent.name}`}
                description="Menambah saldo deposit agen; tercatat di riwayat."
                action={topUpAgentAction}
                submitLabel="Tambah Saldo"
              >
                <input type="hidden" name="agentId" value={agent.id} />
                <div className="grid gap-1 text-sm font-medium">
                  <label htmlFor={`deposit-amount-${agent.id}`}>
                    Jumlah (Rp)
                  </label>
                  <MoneyInput
                    id={`deposit-amount-${agent.id}`}
                    name="amount"
                    required
                    className="min-h-11 rounded-md border bg-background px-3"
                  />
                </div>
                <label className="grid gap-1 text-sm font-medium">
                  Keterangan
                  <input
                    name="note"
                    maxLength={255}
                    className="min-h-11 rounded-md border bg-background px-3"
                  />
                </label>
              </FormDialog>
            </div>
          )}
        </section>
      )}
      {!agent ? (
        <EmptyState
          title="Pilih agen"
          description="Pilih agen untuk melihat saldo dan riwayat deposit."
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Belum ada riwayat"
          description="Belum ada perubahan saldo untuk agen ini."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">Saldo Sebelumnya</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead className="text-right">Komisi Agent</TableHead>
                <TableHead className="text-right">Saldo Akhir</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead>Tgl dibuat</TableHead>
                <TableHead>Dibuat oleh</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-right tabular-nums">
                    {rupiah(r.balanceBefore.toString())}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {rupiah(r.amount.toString())}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {rupiah(r.commission.toString())}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {rupiah(r.balanceAfter.toString())}
                  </TableCell>
                  <TableCell>{KIND[r.kind] ?? r.kind}</TableCell>
                  <TableCell>{r.note ?? "-"}</TableCell>
                  <TableCell>{businessDateTimeString(r.createdAt)}</TableCell>
                  <TableCell>{r.createdBy?.name ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
