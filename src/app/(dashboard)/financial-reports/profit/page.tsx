import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/patterns/content-state";
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
import { isAdministrator, permits } from "@/features/identity/permissions";
import { currentIdentity } from "@/features/identity/server/context";
import {
  day,
  ModulHeader,
  one,
  selectClass,
} from "@/features/modul/components/page-bits";
import { profitReport } from "@/features/modul/server/profit-report";
import { businessYearMonth } from "@/lib/date/business-date";
import { prisma } from "@/lib/db";
import { formatRupiah } from "@/lib/format/rupiah";

export const metadata: Metadata = { title: "Laporan Keuntungan" };

// Session- and query-dependent page; blocking render.
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
const rp = (n: number) => formatRupiah(n, { prefix: false });

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const current = await currentIdentity();
  if (!current) redirect("/login");
  if (!permits(current.actor, "view", "debt_payment"))
    return (
      <EmptyState
        title="Akses ditolak"
        description="Grup Anda belum memiliki hak lihat Pembayaran Hutang. Minta admin menambahkannya di Hak Akses Menu."
      />
    );
  const query = await searchParams;
  const now = businessYearMonth();
  const pick = (v: string | undefined, min: number, max: number, d: number) => {
    const n = Number(v);
    return Number.isInteger(n) && n >= min && n <= max ? n : d;
  };
  const month = pick(one(query.month), 1, 12, now.month);
  const year = pick(one(query.year), 2000, 2100, now.year);
  const vendorParam = one(query.vendorId) ?? "";
  const [report, vendors] = await Promise.all([
    profitReport(current.actor, {
      month,
      year,
      vendorId: /^\d+$/.test(vendorParam) ? vendorParam : "",
    }),
    prisma.vendor.findMany({
      where: {
        deletedAt: null,
        vendorBills: {
          some: isAdministrator(current.actor)
            ? {}
            : { branchId: { in: current.actor.branchIds } },
        },
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return (
    <div className="min-w-0 space-y-5">
      <ModulHeader
        title="Laporan Keuntungan"
        info="Daftar Rekap Laporan Laba per tagihan vendor (Pembayaran Hutang) menurut bulan Tanggal tagihan: Biaya = jumlah Grand Total AWB di tagihan, Biaya Vendor = nilai tagihan vendor, Laba = Biaya - Biaya Vendor. Bukan laporan Rugi Laba akunting."
      />
      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-lg border bg-background p-4"
      >
        <label className="grid gap-1 text-sm font-medium">
          Bulan
          <select name="month" defaultValue={month} className={selectClass}>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Tahun
          <select name="year" defaultValue={year} className={selectClass}>
            {Array.from({ length: 7 }, (_, i) => now.year - i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <label className="grid min-w-48 gap-1 text-sm font-medium">
          Penjual
          <select
            name="vendorId"
            defaultValue={vendorParam}
            className={selectClass}
          >
            <option value="">Semua</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" className="min-h-11">
          Cari
        </Button>
        <Button
          type="submit"
          variant="outline"
          className="min-h-11"
          formAction="/financial-reports/profit/export"
        >
          Ekspor Excel
        </Button>
      </form>
      {report.rows.length === 0 ? (
        <EmptyState
          title="Belum ada data"
          description="Tidak ada tagihan vendor pada bulan ini."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Penjual</TableHead>
                <TableHead>No. Faktur</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Biaya</TableHead>
                <TableHead className="text-right">Biaya Vendor</TableHead>
                <TableHead className="text-right">Laba</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.vendor}</TableCell>
                  <TableCell className="font-mono">{r.invoiceNo}</TableCell>
                  <TableCell>{day(r.billDate)}</TableCell>
                  <TableCell>{r.status}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {rp(r.revenue)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {rp(r.vendorCost)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {rp(r.profit)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4}>Total</TableCell>
                <TableCell className="text-right tabular-nums">
                  {rp(report.total.revenue)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {rp(report.total.vendorCost)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {rp(report.total.profit)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  );
}
