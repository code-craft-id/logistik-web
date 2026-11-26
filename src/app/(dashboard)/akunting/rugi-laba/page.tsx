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
import { profitLoss } from "@/features/finance/server/profit-loss";
import { isAdministrator } from "@/features/identity/permissions";
import { currentIdentity } from "@/features/identity/server/context";
import { requirePagePermission } from "@/lib/auth/page-access";
import { businessYearMonth } from "@/lib/date/business-date";
import { prisma } from "@/lib/db";
import { formatRupiah } from "@/lib/format/rupiah";

export const metadata: Metadata = { title: "Hitung Rugi Laba" };

// Query- and session-dependent; blocking render.
export const instant = false;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const field = "min-h-11 w-full rounded-md border bg-background px-2 text-sm";
const one = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v) ?? "";
const money = (v: number) => formatRupiah(v.toFixed(2), { prefix: false });
const pct = (v: number | null) => (v === null ? "nan %" : `${v} %`);

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePagePermission("view", "financial_report");
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const params = await searchParams;
  const now = new Date();
  const businessNow = businessYearMonth(now);
  const month = Number(one(params.month)) || businessNow.month;
  const year = Number(one(params.year)) || businessNow.year;
  const branchId = one(params.branchId);
  const branches = await prisma.branch.findMany({
    where: {
      deletedAt: null,
      ...(isAdministrator(current.actor)
        ? {}
        : { id: { in: current.actor.branchIds } }),
    },
    select: { id: true, code: true, name: true },
    orderBy: { name: "asc" },
  });
  const report =
    one(params.show) === "1"
      ? await profitLoss(current.actor, { month, year, branchId })
      : null;
  const label = `${MONTHS[month - 1].slice(0, 3)}'${String(year).slice(2)}`;

  return (
    <div className="min-w-0 space-y-5">
      <header className="flex items-center gap-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Hitung Rugi Laba
        </h1>
        <InfoTip text="Laba rugi dari jurnal terposting: akun pendapatan menambah, akun beban mengurangi, dikelompokkan per Kategori Rugi Laba (atur di Akun & kategori). Kolom bulan terpilih, % terhadap pendapatan bulan itu, dan tahun berjalan (Januari sampai bulan terpilih). Cost Centre NASIONAL = semua cabang yang boleh Anda lihat." />
      </header>
      <form
        action="/akunting/rugi-laba"
        method="get"
        className="grid max-w-2xl gap-4 rounded-lg border bg-background p-4"
      >
        <input type="hidden" name="show" value="1" />
        <div className="grid gap-2 sm:grid-cols-[9rem_1fr_7rem] sm:items-center">
          <label htmlFor="pl-month" className="text-sm font-medium">
            Bulan
          </label>
          <select
            id="pl-month"
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
            {Array.from({ length: 10 }, (_, i) => businessNow.year - i).map(
              (y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ),
            )}
          </select>
        </div>
        <div className="grid gap-2 sm:grid-cols-[9rem_1fr] sm:items-center">
          <label htmlFor="pl-branch" className="text-sm font-medium">
            Cost Centre
          </label>
          <select
            id="pl-branch"
            name="branchId"
            defaultValue={branchId}
            className={field}
          >
            <option value="">--NASIONAL--</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.code} | {b.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" className="min-h-11">
            Search
          </Button>
          <Button asChild variant="outline" className="min-h-11">
            <Link href="/akunting/rugi-laba">Refresh</Link>
          </Button>
          {report && (
            <Button asChild variant="outline" className="min-h-11">
              <a
                href={`/akunting/rugi-laba/export?${new URLSearchParams({ month: String(month), year: String(year), branchId })}`}
              >
                Export
              </a>
            </Button>
          )}
        </div>
      </form>

      {report && (
        <section
          aria-label="Daftar Rugi Laba"
          className="min-w-0 rounded-lg border bg-background"
        >
          <div className="flex flex-wrap justify-between gap-2 border-b p-3 text-sm">
            <h2 className="font-semibold">Daftar Rugi Laba</h2>
            <span>Cost Centre: {report.costCentre}</span>
          </div>
          <div className="overflow-x-auto">
            <Table className="min-w-[48rem]">
              <TableHeader>
                <TableRow>
                  <TableHead>KODE AKUN</TableHead>
                  <TableHead>INDUK</TableHead>
                  <TableHead className="text-right">HASIL {label}</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="text-right">
                    Current Year {year}
                  </TableHead>
                </TableRow>
              </TableHeader>
              {report.groups.length === 0 ? (
                <TableBody>
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="p-4 text-center text-muted-foreground"
                    >
                      Belum ada jurnal pendapatan/beban terposting pada periode
                      ini.
                    </TableCell>
                  </TableRow>
                </TableBody>
              ) : (
                report.groups.map((g) => (
                  <TableBody key={g.code ?? "none"}>
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={5} className="font-semibold">
                        {g.code ? `${g.code} | ${g.name}` : g.name}
                      </TableCell>
                    </TableRow>
                    {g.rows.map((r) => (
                      <TableRow key={r.code}>
                        <TableCell>
                          <span className="font-mono">{r.code}</span> {r.name}
                        </TableCell>
                        <TableCell>{r.parent ?? "-"}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {money(r.month)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {pct(r.percent)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {money(r.year)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={2} className="font-semibold">
                        TOTAL {g.name}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {money(g.month)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {pct(g.percent)}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {money(g.year)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                ))
              )}
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2} className="font-semibold">
                    LABA (RUGI) BERSIH
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {money(report.total.month)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {pct(report.total.percent)}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {money(report.total.year)}
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
