import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/patterns/content-state";
import { Button } from "@/components/ui/button";
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
import {
  day,
  ModulHeader,
  one,
  rupiah,
  selectClass,
} from "@/features/modul/components/page-bits";
import { codReport } from "@/features/modul/server/cod";
import { businessYearMonth } from "@/lib/date/business-date";

export const metadata: Metadata = { title: "Report COD" };

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

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const current = await currentIdentity();
  if (!current) redirect("/login");
  if (!permits(current.actor, "view", "payment"))
    return (
      <EmptyState
        title="Akses ditolak"
        description="Grup Anda belum memiliki hak lihat Pembayaran. Minta admin menambahkannya di Hak Akses Menu."
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
  const report = await codReport(current.actor, { month, year });
  return (
    <div className="min-w-0 space-y-5">
      <ModulHeader
        title="Report COD"
        info="AWB dengan Nilai COD yang tujuannya cabang Anda, menurut bulan tanggal AWB: status pengiriman, penerima, Nilai/Fee COD dan apakah kasnya sudah diterima (Kas Terima). Ekspor mengunduh Excel bulan yang sama."
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
        <Button type="submit" className="min-h-11">
          Cari
        </Button>
        <Button
          type="submit"
          variant="outline"
          className="min-h-11"
          formAction="/branch-reports/report-cod/export"
        >
          Ekspor
        </Button>
      </form>
      {report.rows.length === 0 ? (
        <EmptyState
          title="Belum ada data"
          description="Tidak ada AWB COD pada bulan ini."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  "AWB No.",
                  "Tanggal",
                  "Moda",
                  "Servis",
                  "Asal",
                  "Tujuan",
                  "Pengirim",
                  "Penerima Barang",
                  "Koli",
                  "Kilo",
                  "Deskripsi",
                  "Status Pengiriman",
                  "Komentar",
                  "Diterima Oleh",
                  "Nilai COD",
                  "Kas Terima",
                ].map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono">{r.awbNo ?? "-"}</TableCell>
                  <TableCell>{day(r.transactionDate)}</TableCell>
                  <TableCell>{r.transportMode?.name ?? "-"}</TableCell>
                  <TableCell>{r.deliveryService?.name ?? "-"}</TableCell>
                  <TableCell>{r.originBranch?.name ?? "-"}</TableCell>
                  <TableCell>{r.destinationBranch?.name ?? "-"}</TableCell>
                  <TableCell>{r.senderName ?? "-"}</TableCell>
                  <TableCell>{r.receiverName ?? "-"}</TableCell>
                  <TableCell className="text-right">{r.koli ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    {r.kilo?.toString() ?? "-"}
                  </TableCell>
                  <TableCell>{r.description ?? "-"}</TableCell>
                  <TableCell>{r.status}</TableCell>
                  <TableCell>{r.remarks ?? "-"}</TableCell>
                  <TableCell>
                    {r.deliveryProofs[0]?.receiverName ?? "-"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {rupiah(r.codValue?.toString())}
                  </TableCell>
                  <TableCell>{r.codReceivedAt ? "Sudah" : "Belum"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
