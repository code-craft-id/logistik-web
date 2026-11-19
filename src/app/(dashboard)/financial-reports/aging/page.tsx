import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { InfoTip } from "@/components/patterns/info-tip";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isAdministrator } from "@/features/identity/permissions";
import { currentIdentity } from "@/features/identity/server/context";
import {
  AGING_HEADERS,
  agingReport,
} from "@/features/reports/aging/server/aging";
import { requirePagePermission } from "@/lib/auth/page-access";
import { prisma } from "@/lib/db";
import { formatRupiah } from "@/lib/format/rupiah";

export const metadata: Metadata = { title: "Rekap Aging Pelanggan" };

// Query- and session-dependent; blocking render.
export const instant = false;

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
const field = "min-h-11 w-full rounded-md border bg-background px-2 text-sm";
const one = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v) ?? "";
const money = (v: number) => formatRupiah(v.toFixed(2), { prefix: false });

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePagePermission("view", "invoice");
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const params = await searchParams;
  const now = new Date();
  const month = Number(one(params.month)) || now.getUTCMonth() + 1;
  const year = Number(one(params.year)) || now.getUTCFullYear();
  const customerId = one(params.customerId);
  const show = one(params.show) === "1";
  const admin = isAdministrator(current.actor);
  const customers = await prisma.customer.findMany({
    where: {
      deletedAt: null,
      ...(admin
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
  });
  const report = show
    ? await agingReport(current.actor, { month, year, customerId })
    : null;
  const pct = (v: number | null) => (v === null ? "NAN%" : `${v}%`);

  return (
    <div className="min-w-0 space-y-5">
      <header className="flex items-center gap-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Daftar Rekap Penjualan Aging
        </h1>
        <InfoTip text="Invoice terbit pada bulan terpilih yang belum lunas, per invoice: tagihan, termin (KETENTUAN), usia faktur (hari sejak tanggal invoice) dan sisa tagihan pada kolom umur 0–21, >21–30, >30 hari; HASIL AKHIR berisi total dan persentase. Aturan ini menunggu konfirmasi bagian keuangan." />
      </header>
      <form
        action="/financial-reports/aging"
        method="get"
        className="grid max-w-2xl gap-4 rounded-lg border bg-background p-4"
      >
        <input type="hidden" name="show" value="1" />
        <div className="grid gap-2 sm:grid-cols-[9rem_1fr_7rem] sm:items-center">
          <label htmlFor="aging-month" className="text-sm font-medium">
            Bulan
          </label>
          <select
            id="aging-month"
            name="month"
            defaultValue={month}
            className={field}
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            name="year"
            aria-label="Tahun"
            defaultValue={year}
            className={field}
          >
            {Array.from({ length: 7 }, (_, i) => now.getUTCFullYear() - i).map(
              (y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ),
            )}
          </select>
        </div>
        <div className="grid gap-2 sm:grid-cols-[9rem_1fr] sm:items-center">
          <label htmlFor="aging-customer" className="text-sm font-medium">
            Pelanggan
          </label>
          <select
            id="aging-customer"
            name="customerId"
            defaultValue={customerId}
            className={field}
          >
            <option value="">Semua</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            formAction="/financial-reports/aging/export"
            variant="destructive"
            className="min-h-11"
          >
            Ekspor Excel
          </Button>
          <Button type="submit" className="min-h-11">
            Menampilkan
          </Button>
          <Button asChild variant="outline" className="min-h-11">
            <Link href="/financial-reports/aging">Refresh</Link>
          </Button>
        </div>
      </form>

      {report && (
        <section
          aria-label="Rekap aging pelanggan"
          className="min-w-0 rounded-lg border bg-background"
        >
          <div className="space-y-0.5 border-b p-3 text-sm">
            <p className="font-semibold">REKAP AGING PELANGGAN, BELUM LUNAS</p>
            <p>{report.company}</p>
            <p>( IDR )</p>
            <p>Pelanggan : {report.customer}</p>
            <p>
              Tanggal Mulai : {report.start} · Tanggal Akhir : {report.end}
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table className="min-w-[80rem]">
              <TableHeader>
                <TableRow>
                  {AGING_HEADERS.map((h) => (
                    <TableHead key={h} className="whitespace-nowrap">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={12}
                      className="p-4 text-center text-muted-foreground"
                    >
                      Tidak ada invoice belum lunas pada periode ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  report.items.map((r, i) => (
                    <TableRow key={r.number}>
                      <TableCell className="tabular-nums">{i + 1}</TableCell>
                      <TableCell className="tabular-nums">
                        {r.invoiceDate}
                      </TableCell>
                      <TableCell className="font-mono">{r.number}</TableCell>
                      <TableCell className="tabular-nums">
                        {r.handoverDate ?? "-"}
                      </TableCell>
                      <TableCell>{r.handoverTo ?? "-"}</TableCell>
                      <TableCell className="whitespace-normal">
                        {r.company}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {money(r.total)}
                      </TableCell>
                      <TableCell>{r.term}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.ageDays}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {money(r.b0_21)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {money(r.b21_30)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {money(r.b30plus)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={9} className="text-right font-semibold">
                    HASIL AKHIR
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {money(report.totals.b0_21)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {money(report.totals.b21_30)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {money(report.totals.b30plus)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={9} />
                  <TableCell className="text-right">
                    {pct(report.percent.b0_21)}
                  </TableCell>
                  <TableCell className="text-right">
                    {pct(report.percent.b21_30)}
                  </TableCell>
                  <TableCell className="text-right">
                    {pct(report.percent.b30plus)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </section>
      )}
    </div>
  );
}
