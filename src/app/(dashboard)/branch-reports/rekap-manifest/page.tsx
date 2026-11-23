import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/patterns/content-state";
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
import { manifestRecap } from "@/features/reports/manifest-recap/server/manifest-recap";
import { requirePagePermission } from "@/lib/auth/page-access";
import { businessYearMonth } from "@/lib/date/business-date";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Rekap Manifest" };

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
const field = "min-h-11 w-full rounded-md border bg-background px-2 text-sm";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePagePermission("view", "manifest_report");
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const actor = current.actor;
  const query = Object.fromEntries(
    Object.entries(await searchParams).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
  const now = businessYearMonth();
  const values = {
    month: query.month ?? String(now.month),
    year: query.year ?? String(now.year),
    branchId: query.branchId ?? "",
    sheet: query.sheet ?? "multiple",
  };
  const [branches, recap] = await Promise.all([
    prisma.branch.findMany({
      where: {
        deletedAt: null,
        ...(isAdministrator(actor) ? {} : { id: { in: actor.branchIds } }),
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    manifestRecap(actor, values).catch(() => null),
  ]);
  const exportHref = `/branch-reports/rekap-manifest/export?${new URLSearchParams(values)}`;
  return (
    <div className="min-w-0 space-y-5">
      <header className="flex items-center gap-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Rekap Manifest
        </h1>
        <InfoTip text="Rekap manifest per bulan untuk satu cabang atau semua cabang Anda: per manifest total AWB aktif, koli, berat dan volume. Ekspor Excel: Multiple Sheet = satu sheet per tanggal manifest; One Sheet = semua dalam satu sheet." />
      </header>
      <form
        method="get"
        className="grid gap-3 rounded-lg border bg-background p-4 sm:grid-cols-2 lg:grid-cols-[1fr_7rem_1fr_1fr_auto] lg:items-end"
      >
        <div className="space-y-2">
          <label htmlFor="rm-month" className="text-sm font-medium">
            Bulan
          </label>
          <select
            id="rm-month"
            name="month"
            defaultValue={values.month}
            className={field}
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="rm-year" className="text-sm font-medium">
            Tahun
          </label>
          <select
            id="rm-year"
            name="year"
            defaultValue={values.year}
            className={field}
          >
            {Array.from({ length: 7 }, (_, i) => now.year - i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="rm-branch" className="text-sm font-medium">
            Cabang
          </label>
          <select
            id="rm-branch"
            name="branchId"
            defaultValue={values.branchId}
            className={field}
          >
            <option value="">-- Semua cabang --</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="rm-sheet" className="text-sm font-medium">
            Jenis Lembar
          </label>
          <select
            id="rm-sheet"
            name="sheet"
            defaultValue={values.sheet}
            className={field}
          >
            <option value="multiple">-- Multiple Sheet --</option>
            <option value="one">-- One Sheet --</option>
          </select>
        </div>
        <Button type="submit" variant="outline" className="min-h-11">
          Tampilkan
        </Button>
      </form>
      {!recap ? (
        <EmptyState
          title="Filter tidak valid"
          description="Pilih bulan, tahun dan cabang yang Anda miliki aksesnya."
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {recap.branch} · {MONTHS[recap.input.month - 1]}{" "}
              {recap.input.year} · {recap.rows.length} manifest
              {recap.truncated ? " (dibatasi 5000 baris)" : ""}
            </p>
            <Button asChild variant="destructive" className="min-h-11">
              <a href={exportHref}>Ekspor Excel</a>
            </Button>
          </div>
          {recap.rows.length === 0 ? (
            <EmptyState
              title="Tidak ada manifest"
              description="Belum ada manifest pada bulan dan cabang ini."
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No.</TableHead>
                    <TableHead>Manifest No.</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Asal</TableHead>
                    <TableHead>Transit</TableHead>
                    <TableHead>Tujuan</TableHead>
                    <TableHead className="text-right">Tot. AWB</TableHead>
                    <TableHead className="text-right">Tot. Koli</TableHead>
                    <TableHead className="text-right">Tot. Berat</TableHead>
                    <TableHead className="text-right">Tot. Volume</TableHead>
                    <TableHead>Kendaraan</TableHead>
                    <TableHead>Kurir / Driver</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recap.rows.map((row, index) => (
                    <TableRow key={row.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium whitespace-nowrap">
                        <Link
                          href={`/manifest/${row.id}`}
                          className="text-primary underline underline-offset-4"
                        >
                          {row.manifestNo}
                        </Link>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {row.day}
                      </TableCell>
                      <TableCell>{row.origin}</TableCell>
                      <TableCell>{row.transit}</TableCell>
                      <TableCell>{row.destination}</TableCell>
                      <TableCell className="text-right">{row.awb}</TableCell>
                      <TableCell className="text-right">{row.koli}</TableCell>
                      <TableCell className="text-right">{row.kilo}</TableCell>
                      <TableCell className="text-right">{row.volume}</TableCell>
                      <TableCell>{row.vehicle}</TableCell>
                      <TableCell>{row.courier}</TableCell>
                      <TableCell>{row.vendor}</TableCell>
                      <TableCell>{row.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={6}>TOTAL</TableCell>
                    <TableCell className="text-right">
                      {recap.total.awb}
                    </TableCell>
                    <TableCell className="text-right">
                      {recap.total.koli}
                    </TableCell>
                    <TableCell className="text-right">
                      {recap.total.kilo}
                    </TableCell>
                    <TableCell className="text-right">
                      {recap.total.volume}
                    </TableCell>
                    <TableCell colSpan={4} />
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
