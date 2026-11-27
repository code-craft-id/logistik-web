import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/patterns/content-state";
import { PageTabs } from "@/components/patterns/page-tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isAdministrator, permits } from "@/features/identity/permissions";
import { currentIdentity } from "@/features/identity/server/context";
import {
  day,
  ModulHeader,
  one,
  rupiah,
  selectClass,
} from "@/features/modul/components/page-bits";
import { agentChoices } from "@/features/organization/server/agent-deposit";
import { agentAwbs } from "@/features/organization/server/agent-reports";
import { businessDateString } from "@/lib/date/business-date";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Laporan Agen" };

// Session- and query-dependent page; blocking render.
export const instant = false;

function Pick({
  name,
  label,
  all,
  value,
  options,
}: {
  name: string;
  label: string;
  all: string;
  value: string;
  options: { id: number; name: string }[];
}) {
  return (
    <label className="grid min-w-44 gap-1 text-sm font-medium">
      {label}
      <select name={name} defaultValue={value} className={selectClass}>
        <option value="">{all}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const current = await currentIdentity();
  if (!current) redirect("/login");
  if (!permits(current.actor, "view", "transaction"))
    return (
      <EmptyState
        title="Akses ditolak"
        description="Grup Anda belum memiliki hak lihat Transaksi. Minta admin menambahkannya di Hak Akses Menu."
      />
    );
  const query = await searchParams;
  const komisi = one(query.tab) === "komisi";
  const today = businessDateString();
  const input = {
    tab: komisi ? "komisi" : "transaksi",
    from: one(query.from) ?? `${today.slice(0, 8)}01`,
    to: one(query.to) ?? today,
    agentId: one(query.agentId) ?? "",
    originId: one(query.originId) ?? "",
    destinationId: one(query.destinationId) ?? "",
    customerId: one(query.customerId) ?? "",
    costTypeId: one(query.costTypeId) ?? "",
  };
  const clean = (v: string) => (/^\d+$/.test(v) ? v : "");
  const [report, agents, branches, customers, costTypes] = await Promise.all([
    agentAwbs(current.actor, {
      ...input,
      agentId: clean(input.agentId),
      originId: clean(input.originId),
      destinationId: clean(input.destinationId),
      customerId: clean(input.customerId),
      costTypeId: clean(input.costTypeId),
    }),
    agentChoices(current.actor),
    prisma.branch.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.customer.findMany({
      where: {
        deletedAt: null,
        ...(isAdministrator(current.actor)
          ? {}
          : {
              OR: [
                { branchId: { in: current.actor.branchIds } },
                { branchId: null },
              ],
            }),
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 2000,
    }),
    prisma.costType.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  const totals = report.rows.reduce(
    (t, r) => ({
      biaya: t.biaya + Number(r.biaya ?? 0),
      komisi: t.komisi + Number(r.commission ?? 0),
    }),
    { biaya: 0, komisi: 0 },
  );
  return (
    <div className="min-w-0 space-y-5">
      <ModulHeader
        title={komisi ? "Rekap Komisi Agen" : "Rekap Transaksi Agen"}
        info="AWB yang dibuat untuk agen dalam periode tanggal AWB. Transaksi Agen bisa disaring per Destination, Agent dan Billing Type; Komisi Agen per Outbound (asal), Inbound (tujuan), Agent dan Customer. Komisi = komisi % agen x Grand Total saat AWB dibuat."
      />
      <PageTabs
        label="Laporan Agen"
        active={komisi ? "komisi" : "transaksi"}
        tabs={[
          { key: "transaksi", label: "Transaksi Agen", href: "/agent-reports" },
          {
            key: "komisi",
            label: "Laporan Komisi Agen",
            href: "/agent-reports?tab=komisi",
          },
        ]}
      />
      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-lg border bg-background p-4"
      >
        {komisi && <input type="hidden" name="tab" value="komisi" />}
        <label className="grid gap-1 text-sm font-medium">
          Dari
          <input
            type="date"
            name="from"
            defaultValue={input.from}
            className={selectClass}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Sampai
          <input
            type="date"
            name="to"
            defaultValue={input.to}
            className={selectClass}
          />
        </label>
        {komisi && (
          <Pick
            name="originId"
            label="Outbound"
            all="-- All Outbound --"
            value={input.originId}
            options={branches}
          />
        )}
        <Pick
          name="destinationId"
          label={komisi ? "Inbound" : "Destination"}
          all={komisi ? "-- All Inbound --" : "-- All Destination --"}
          value={input.destinationId}
          options={branches}
        />
        <Pick
          name="agentId"
          label="Agent"
          all="-- All Agent --"
          value={input.agentId}
          options={agents}
        />
        {komisi ? (
          <Pick
            name="customerId"
            label="Customer"
            all="-- All Customer --"
            value={input.customerId}
            options={customers}
          />
        ) : (
          <Pick
            name="costTypeId"
            label="Billing Type"
            all="-- All Billing Type --"
            value={input.costTypeId}
            options={costTypes}
          />
        )}
        <Button type="submit" className="min-h-11">
          Cari
        </Button>
        <Button
          type="submit"
          variant="export"
          className="min-h-11"
          formAction="/agent-reports/export"
        >
          Export Excel
        </Button>
      </form>
      {report.rows.length === 0 ? (
        <EmptyState
          title="Belum ada data"
          description="Tidak ada AWB agen untuk filter ini."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>AWB No.</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Agen</TableHead>
                <TableHead>Asal</TableHead>
                <TableHead>Tujuan</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Pembayaran</TableHead>
                <TableHead className="text-right">Grand Total</TableHead>
                {komisi ? (
                  <TableHead className="text-right">Komisi Agen</TableHead>
                ) : (
                  <TableHead>Status</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono">{r.awbNo ?? "-"}</TableCell>
                  <TableCell>{day(r.transactionDate)}</TableCell>
                  <TableCell>{r.agent?.name ?? "-"}</TableCell>
                  <TableCell>{r.originBranch?.name ?? "-"}</TableCell>
                  <TableCell>{r.destinationBranch?.name ?? "-"}</TableCell>
                  <TableCell>{r.customer?.name ?? "-"}</TableCell>
                  <TableCell>{r.costType?.name ?? "-"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {rupiah(r.biaya?.toString())}
                  </TableCell>
                  {komisi ? (
                    <TableCell className="text-right tabular-nums">
                      {rupiah(r.commission?.toString())}
                    </TableCell>
                  ) : (
                    <TableCell>{r.status}</TableCell>
                  )}
                </TableRow>
              ))}
              <TableRow className="font-semibold">
                <TableCell colSpan={7}>Total</TableCell>
                <TableCell className="text-right tabular-nums">
                  {rupiah(String(totals.biaya))}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {komisi ? rupiah(String(totals.komisi)) : ""}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
