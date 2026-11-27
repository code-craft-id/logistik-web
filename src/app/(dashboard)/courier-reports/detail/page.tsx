import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/patterns/content-state";
import { InfoTip } from "@/components/patterns/info-tip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { currentIdentity } from "@/features/identity/server/context";
import { one, selectClass } from "@/features/modul/components/page-bits";
import {
  courierDetailOptions,
  courierDetailReport,
} from "@/features/reports/courier-detail/server/courier-detail";
import { requirePagePermission } from "@/lib/auth/page-access";

export const metadata: Metadata = { title: "Laporan Detail Kurir" };

// Session- and query-dependent page; blocking render.
export const instant = false;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePagePermission("view", "delivery_report");
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const query = await searchParams;
  const [report, options] = await Promise.all([
    courierDetailReport(current.actor, {
      from: one(query.from),
      to: one(query.to),
      branchId: one(query.branchId),
      courierId: one(query.courierId),
      status: one(query.status),
    }),
    courierDetailOptions(current.actor),
  ]);
  const f = report.filters;
  return (
    <div className="min-w-0 space-y-5">
      <header className="flex items-center gap-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Laporan Detail Kurir
        </h1>
        <InfoTip text="Setiap AWB yang dibawa kurir lewat DRS (dari manifest maupun Kurir Kota), dengan hasil antar: Sukses = Terkirim, Failed = Gagal atau Retur, Pending = belum dicatat. Tanggal = tanggal DRS (Asia/Jakarta). L.Time = Lead Time di AWB." />
      </header>
      <form
        method="get"
        className="grid items-end gap-3 rounded-lg border bg-background p-4 sm:grid-cols-2 lg:grid-cols-[10rem_10rem_1fr_1fr_10rem_auto]"
      >
        <div className="min-w-0 space-y-2">
          <Label htmlFor="cd-from">Dari tanggal</Label>
          <Input
            id="cd-from"
            name="from"
            type="date"
            defaultValue={f.from}
            className="min-h-11"
          />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="cd-to">Sampai tanggal</Label>
          <Input
            id="cd-to"
            name="to"
            type="date"
            defaultValue={f.to}
            className="min-h-11"
          />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="cd-branch">Branch</Label>
          <select
            id="cd-branch"
            name="branchId"
            defaultValue={f.branchId ?? ""}
            className={selectClass}
          >
            <option value="">Semua cabang Anda</option>
            {options.branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="cd-courier">Kurir</Label>
          <select
            id="cd-courier"
            name="courierId"
            defaultValue={f.courierId ?? ""}
            className={selectClass}
          >
            <option value="">Semua kurir</option>
            {options.couriers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="cd-status">Status</Label>
          <select
            id="cd-status"
            name="status"
            defaultValue={f.status ?? ""}
            className={selectClass}
          >
            <option value="">Semua</option>
            <option value="SUCCESS">Sukses</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
        <Button type="submit" variant="outline" className="min-h-11">
          Cari
        </Button>
      </form>
      <dl className="grid grid-cols-3 gap-3 text-sm sm:max-w-xl">
        {(
          [
            ["Tot. Sukses", report.totals.success],
            ["Tot. Pending", report.totals.pending],
            ["Tot. Failed", report.totals.failed],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="rounded-lg border bg-background p-3">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-lg font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      {report.rows.length === 0 ? (
        <EmptyState
          title="Tidak ada data"
          description={`Tidak ada AWB di DRS pada ${f.from} sampai ${f.to} untuk filter ini.`}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-background">
          {report.truncated && (
            <p className="border-b p-3 text-sm text-muted-foreground">
              Menampilkan 2000 baris terbaru. Persempit periode atau filter.
            </p>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>DRS No.</TableHead>
                <TableHead>AWB No</TableHead>
                <TableHead>Kurir</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Asal</TableHead>
                <TableHead>Tujuan</TableHead>
                <TableHead>Pengirim</TableHead>
                <TableHead>Layanan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Penerima</TableHead>
                <TableHead>Diterima Oleh</TableHead>
                <TableHead>Tgl. Diterima</TableHead>
                <TableHead>L.Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap">
                    {row.sheetNo}
                  </TableCell>
                  <TableCell className="font-medium whitespace-nowrap">
                    <Link
                      href={`/transactions/${row.transactionId}`}
                      className="text-primary underline underline-offset-4"
                    >
                      {row.awbNo ?? "-"}
                    </Link>
                  </TableCell>
                  <TableCell>{row.courier ?? "-"}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {row.date}
                  </TableCell>
                  <TableCell>{row.origin ?? "-"}</TableCell>
                  <TableCell>{row.destination ?? "-"}</TableCell>
                  <TableCell>{row.sender ?? "-"}</TableCell>
                  <TableCell>{row.service ?? "-"}</TableCell>
                  <TableCell>{row.status}</TableCell>
                  <TableCell>{row.receiver ?? "-"}</TableCell>
                  <TableCell>{row.receivedBy ?? "-"}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {row.receivedAt ?? "-"}
                  </TableCell>
                  <TableCell>{row.leadTime ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
