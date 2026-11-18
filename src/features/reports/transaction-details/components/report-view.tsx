import Form from "next/form";
import Link from "next/link";
import { EmptyState } from "@/components/patterns/content-state";
import { ComboSelect } from "@/components/ui/combo-select";
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
import {
  type TransactionReportResult,
  transactionReportRoute,
} from "../contracts";
import {
  type TransactionReportFilters,
  transactionReportFormValues,
  transactionReportSortFields,
} from "../filters";
import { ReportSubmitButton } from "./submit-button";

const headers = [
  "AWB No.",
  "tanggal (UTC)",
  "Asal",
  "Tujuan",
  "Pengirim",
  "Penerima Barang",
  "Koli",
  "Kilo",
  "Status Pengiriman",
];
function reportUrl(f: TransactionReportFilters, page?: number) {
  const query = new URLSearchParams({
    startDate: f.startDate,
    endDate: f.endDate,
    sortBy: f.sortBy,
    sortDirection: f.sortDirection,
  });
  if (page !== undefined) {
    query.set("pageSize", String(f.pageSize));
    query.set("page", String(page));
  }
  if (f.search) query.set("search", f.search);
  if (f.branchId !== null) query.set("branchId", String(f.branchId));
  if (f.originBranchId !== null)
    query.set("originBranchId", String(f.originBranchId));
  if (f.destinationBranchId !== null)
    query.set("destinationBranchId", String(f.destinationBranchId));
  return `${transactionReportRoute}${page === undefined ? "/export" : ""}?${query}`;
}
function value(item: string | number | null) {
  return item === null ? (
    <span>
      <span aria-hidden="true">—</span>
      <span className="sr-only">Tidak tersedia</span>
    </span>
  ) : (
    item
  );
}
export function TransactionReportView({
  result,
  query,
}: {
  result: TransactionReportResult;
  query?: Record<string, string | string[] | undefined>;
}) {
  const filters =
    result.parsed.status === "valid" ? result.parsed.filters : null;
  const display =
    filters ??
    transactionReportFormValues(
      result.state === "invalid" ? query : undefined,
      result.branches,
    );
  const issues = result.parsed.status === "invalid" ? result.parsed.issues : [];
  return (
    <div className="min-w-0 space-y-5 [overflow-wrap:anywhere]">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Detail Transaksi
        </h1>
        <p className="max-w-prose text-sm text-muted-foreground">
          Laporan operasional berdasarkan tanggal transaksi UTC. Setiap baris
          adalah satu transaksi, termasuk status Cancelled; transaksi terhapus
          tidak ditampilkan.
        </p>
        <p className="max-w-prose text-sm text-muted-foreground">
          Laporan dan CSV UTF-8 menampilkan sembilan kolom non-finansial. Asal
          dan Tujuan adalah cabang; Kilo ditampilkan sesuai nilai tersimpan.
        </p>
      </header>
      <section
        aria-label="Filter laporan"
        className="rounded-lg border bg-background p-4 sm:p-6"
      >
        <Form action={transactionReportRoute} className="space-y-4">
          <p id="report-period-hint" className="text-sm text-muted-foreground">
            Pilih tanggal mulai dan akhir, maksimal 31 hari termasuk kedua
            tanggal. Batas hari dan waktu hasil menggunakan UTC.
          </p>
          <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-3 [&>div]:min-w-0">
            <div className="space-y-2">
              <Label htmlFor="report-start">Tanggal mulai (UTC)</Label>
              <Input
                id="report-start"
                type="date"
                name="startDate"
                required
                defaultValue={display.startDate}
                aria-describedby="report-period-hint"
                className="min-h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-end">Tanggal akhir (UTC)</Label>
              <Input
                id="report-end"
                type="date"
                name="endDate"
                required
                defaultValue={display.endDate}
                aria-describedby="report-period-hint"
                className="min-h-11"
              />
            </div>
            {[
              ["branchId", "Cabang asal atau tujuan (gabungan)"],
              ["originBranchId", "Cabang asal"],
              ["destinationBranchId", "Cabang tujuan"],
            ].map(([name, label]) => (
              <div key={name} className="space-y-2">
                <Label htmlFor={`report-${name}`}>{label}</Label>
                <ComboSelect
                  id={`report-${name}`}
                  name={name}
                  defaultValue={
                    display[
                      name as
                        | "branchId"
                        | "originBranchId"
                        | "destinationBranchId"
                    ] ?? ""
                  }
                  className="min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
                >
                  <option value="">Semua cabang yang diizinkan</option>
                  {result.branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </ComboSelect>
              </div>
            ))}
            <div className="space-y-2">
              <Label htmlFor="report-sort">Urutkan menurut</Label>
              <ComboSelect
                id="report-sort"
                name="sortBy"
                defaultValue={display.sortBy}
                className="min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
              >
                {transactionReportSortFields.map((field, index) => (
                  <option key={field} value={field}>
                    {headers[index]}
                  </option>
                ))}
              </ComboSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-direction">Arah urutan</Label>
              <ComboSelect
                id="report-direction"
                name="sortDirection"
                defaultValue={display.sortDirection}
                className="min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
              >
                <option value="asc">Menaik</option>
                <option value="desc">Menurun</option>
              </ComboSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-search">Cari AWB</Label>
              <Input
                id="report-search"
                name="search"
                maxLength={50}
                defaultValue={display.search}
                placeholder="Nomor AWB"
                className="min-h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-size">Baris per halaman</Label>
              <Input
                id="report-size"
                name="pageSize"
                type="number"
                min={1}
                max={100}
                step={1}
                required
                defaultValue={display.pageSize}
                className="min-h-11"
              />
            </div>
          </div>
          {issues.length > 0 && (
            <div
              role="alert"
              className="space-y-1 rounded-md border border-destructive p-3 text-sm text-destructive"
            >
              <p className="font-medium">
                Filter belum valid. Perbaiki pilihan lalu cari kembali.
              </p>
              <ul className="list-disc pl-5">
                {issues.map((issue, index) => (
                  <li key={`${issue.field}-${index}`}>{issue.message}</li>
                ))}
              </ul>
            </div>
          )}
          <ReportSubmitButton />
        </Form>
        {result.state === "ready" && filters && result.canExport && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3">
            <a
              href={reportUrl(filters)}
              download
              aria-describedby="report-export-hint"
              className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
            >
              Unduh CSV
            </a>
            <p
              id="report-export-hint"
              className="text-sm text-muted-foreground"
            >
              Seluruh hasil sesuai filter dan urutan, maksimal 5000 baris.
            </p>
          </div>
        )}
      </section>
      {result.state === "initial" && (
        <EmptyState
          title="Pilih periode laporan"
          description="Pilih rentang tanggal UTC dan cari transaksi untuk menampilkan laporan."
        />
      )}
      {result.state === "ready" && filters && (
        <section
          aria-label="Hasil laporan"
          className="min-w-0 rounded-lg border bg-background"
        >
          <div className="space-y-1 border-b p-4">
            <h2 className="font-semibold">Hasil transaksi</h2>
            <p className="text-sm text-muted-foreground">
              Periode {filters.startDate} sampai {filters.endDate}, UTC · Status
              saat ini
            </p>
          </div>
          {!result.items.length ? (
            <EmptyState
              title={
                result.total
                  ? "Halaman tidak berisi transaksi"
                  : "Tidak ada transaksi"
              }
              description={
                result.total
                  ? "Pilih halaman pertama atau persempit filter laporan."
                  : "Tidak ada transaksi yang cocok dengan periode, pencarian dan cakupan cabang Anda."
              }
              action={
                result.total ? (
                  <Link
                    className="text-primary underline underline-offset-4"
                    href={reportUrl(filters, 1)}
                  >
                    Ke halaman pertama
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <Table className="min-w-5xl [&_td]:align-top">
              <caption className="sr-only">
                Detail transaksi non-finansial; seluruh waktu dalam UTC. Gulir
                tabel untuk membaca semua kolom.
              </caption>
              <TableHeader>
                <TableRow>
                  {headers.map((header) => (
                    <TableHead
                      key={header}
                      scope="col"
                      className={
                        header === "Koli" || header === "Kilo"
                          ? "text-right"
                          : undefined
                      }
                    >
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono whitespace-nowrap">
                      {value(row.awbNo)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      <time dateTime={row.transactionDate}>
                        {row.transactionDate}
                      </time>
                    </TableCell>
                    {[
                      row.originBranch,
                      row.destinationBranch,
                      row.senderName,
                      row.receiverName,
                    ].map((item, index) => (
                      <TableCell
                        key={headers[index + 2]}
                        className="min-w-40 max-w-64 whitespace-normal [overflow-wrap:anywhere]"
                      >
                        {value(item)}
                      </TableCell>
                    ))}
                    <TableCell className="text-right tabular-nums">
                      {value(row.koli)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {value(row.kilo)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {row.status}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t p-4 text-sm">
            <p
              aria-live="polite"
              className="text-muted-foreground tabular-nums"
            >
              Menampilkan {result.items.length ? filters.skip + 1 : 0}–
              {result.items.length ? filters.skip + result.items.length : 0}{" "}
              dari {result.total} baris transaksi · Halaman {filters.page}
            </p>
            <nav aria-label="Halaman laporan" className="flex flex-wrap gap-4">
              {filters.page > 1 && (
                <Link
                  prefetch={false}
                  className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
                  aria-label="Halaman sebelumnya"
                  href={reportUrl(filters, filters.page - 1)}
                >
                  Sebelumnya
                </Link>
              )}
              {filters.page < 1000 &&
                filters.skip + filters.take < result.total && (
                  <Link
                    prefetch={false}
                    className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
                    aria-label="Halaman berikutnya"
                    href={reportUrl(filters, filters.page + 1)}
                  >
                    Berikutnya
                  </Link>
                )}
            </nav>
            {filters.page === 1000 &&
              filters.skip + filters.take < result.total && (
                <p className="w-full text-muted-foreground">
                  Batas 1000 halaman tercapai. Persempit periode atau pencarian
                  AWB.
                </p>
              )}
          </div>
        </section>
      )}
    </div>
  );
}
