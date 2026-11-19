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
import { currentIdentity } from "@/features/identity/server/context";
import {
  AP_HEADERS,
  apAgingReport,
} from "@/features/reports/aging/server/ap-aging";
import { requirePagePermission } from "@/lib/auth/page-access";
import { prisma } from "@/lib/db";
import { formatRupiah } from "@/lib/format/rupiah";

export const metadata: Metadata = { title: "Rekap Aging Pemasok" };

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
  await requirePagePermission("view", "debt_payment");
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const params = await searchParams;
  const now = new Date();
  const month = Number(one(params.month)) || now.getUTCMonth() + 1;
  const year = Number(one(params.year)) || now.getUTCFullYear();
  const vendorId = one(params.vendorId);
  const show = one(params.show) === "1";
  const vendors = await prisma.vendor.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
    take: 2000,
  });
  const report = show
    ? await apAgingReport(current.actor, { month, year, vendorId })
    : null;
  const pct = (v: number | null) => (v === null ? "NAN%" : `${v}%`);

  return (
    <div className="min-w-0 space-y-5">
      <header className="flex items-center gap-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Rekap Aging Pemasok (Laporan AP)
        </h1>
        <InfoTip text="Tagihan vendor/agen (Proses Vendor) yang belum lunas dan bertanggal faktur di bulan terpilih: batas waktu (tanggal terima atau faktur + termin), jumlah tagihan, dan kolom umur 0–30, 31–60, 61–90, > 90 hari sejak tanggal faktur. HASIL AKHIR berisi total dan persentase terhadap total tagihan." />
      </header>
      <form
        action="/financial-reports/ap-aging"
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
          <label htmlFor="aging-vendor" className="text-sm font-medium">
            Pemasok
          </label>
          <select
            id="aging-vendor"
            name="vendorId"
            defaultValue={vendorId}
            className={field}
          >
            <option value="">Semua</option>
            {vendors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            formAction="/financial-reports/ap-aging/export"
            variant="destructive"
            className="min-h-11"
          >
            Ekspor Excel
          </Button>
          <Button type="submit" className="min-h-11">
            Menampilkan
          </Button>
          <Button asChild variant="outline" className="min-h-11">
            <Link href="/financial-reports/ap-aging">Refresh</Link>
          </Button>
        </div>
      </form>

      {report && (
        <section
          aria-label="Rekap aging pemasok"
          className="min-w-0 rounded-lg border bg-background"
        >
          <div className="space-y-0.5 border-b p-3 text-sm">
            <p className="font-semibold">REKAP AGING PEMASOK, BELUM LUNAS</p>
            <p>( IDR )</p>
            <p>Pemasok : {report.vendor}</p>
            <p>
              Tanggal Mulai : {report.start} · Tanggal Akhir : {report.end}
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table className="min-w-[80rem]">
              <TableHeader>
                <TableRow>
                  {AP_HEADERS.map((h) => (
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
                      Tidak ada tagihan vendor belum lunas pada periode ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  report.items.map((r, i) => (
                    <TableRow key={`${r.company}-${r.number}`}>
                      <TableCell className="tabular-nums">{i + 1}</TableCell>
                      <TableCell className="whitespace-normal">
                        {r.company}
                      </TableCell>
                      <TableCell className="font-mono">{r.number}</TableCell>
                      <TableCell className="tabular-nums">
                        {r.billDate}
                      </TableCell>
                      <TableCell>{r.category}</TableCell>
                      <TableCell className="tabular-nums">
                        {r.dueDate}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {money(r.total)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {money(r.b0_30)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {money(r.b31_60)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {money(r.b61_90)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {money(r.b90plus)}
                      </TableCell>
                      <TableCell>{r.note || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={6} className="text-right font-semibold">
                    HASIL AKHIR
                  </TableCell>
                  {(
                    ["total", "b0_30", "b31_60", "b61_90", "b90plus"] as const
                  ).map((k) => (
                    <TableCell key={k} className="text-right tabular-nums">
                      {money(report.totals[k])}
                    </TableCell>
                  ))}
                  <TableCell />
                </TableRow>
                <TableRow>
                  <TableCell colSpan={7} />
                  {(["b0_30", "b31_60", "b61_90", "b90plus"] as const).map(
                    (k) => (
                      <TableCell key={k} className="text-right">
                        {pct(report.percent[k])}
                      </TableCell>
                    ),
                  )}
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </section>
      )}
    </div>
  );
}
