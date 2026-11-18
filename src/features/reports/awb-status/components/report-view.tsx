import Form from "next/form";
import Link from "next/link";
import type { ReactNode } from "react";
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
import { OperationalSubmitButton } from "../../operational/components/submit-button";
import {
  type TransactionReportFilters,
  transactionReportFormValues,
} from "../../transaction-details/filters";
import { awbStatusTable } from "../columns";
import {
  type AwbStatusKind,
  type AwbStatusResult,
  awbStatusExportRoutes,
  awbStatusRoutes,
} from "../contracts";

const titles: Record<AwbStatusKind, string> = {
  pending: "AWB Tertunda",
  manifested: "AWB Termanifest",
  "all-status": "Semua Status",
};
const descriptions: Record<AwbStatusKind, string> = {
  pending:
    "Satu baris per AWB yang belum memiliki penugasan manifest aktif (belum pernah dimanifestkan atau sudah dilepas dari manifest). Periode mengikuti tanggal transaksi. Laporan legacy menampilkan satu baris per koli; data per koli belum tersedia, sehingga laporan ini per AWB.",
  manifested:
    "Satu baris per AWB yang masih ditugaskan aktif pada manifest. AWB yang sudah dilepas tidak ditampilkan. Periode mengikuti tanggal manifest.",
  "all-status":
    "Satu baris per AWB dengan status pengiriman tersimpan. Diterima oleh dan waktu diterima diambil dari percobaan pengantaran terakhir (tanggal DRS terbaru, lalu waktu pengantaran) yang mencatat penerima. Manifes No. hanya untuk penugasan aktif. Moda, layanan dan deskripsi belum memiliki sumber data.",
};

type UrlContext = { allDates: boolean; status: string | null };
function buildUrl(
  ctx: UrlContext,
  kind: AwbStatusKind,
  f: TransactionReportFilters | null,
  page = 1,
  route: string = awbStatusRoutes[kind],
  includePaging = true,
) {
  const query = new URLSearchParams();
  if (kind !== "all-status") query.set("view", kind);
  if (f) {
    if (!ctx.allDates) {
      query.set("startDate", f.startDate);
      query.set("endDate", f.endDate);
    }
    if (f.branchId !== null) query.set("branchId", String(f.branchId));
    if (f.originBranchId !== null)
      query.set("originBranchId", String(f.originBranchId));
    if (ctx.status) query.set("status", ctx.status);
    if (f.destinationBranchId !== null)
      query.set("destinationBranchId", String(f.destinationBranchId));
    if (f.search) query.set("search", f.search);
    if (includePaging) {
      query.set("pageSize", String(f.pageSize));
      query.set("page", String(page));
    }
  }
  return `${route}${query.size ? `?${query}` : ""}`;
}
function cell(value: string | number | null): ReactNode {
  return value === null ? (
    <span>
      <span aria-hidden="true">—</span>
      <span className="sr-only">Tidak tersedia</span>
    </span>
  ) : (
    value
  );
}
const linkClass =
  "inline-flex min-h-11 items-center text-primary underline underline-offset-4";
const selectClass =
  "min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm";

type DisplayQuery = Record<string, string | string[] | undefined>;
/** Display recovery only; these values never authorize or execute a report query. */
function displayValues(
  query: DisplayQuery | undefined,
  branches: AwbStatusResult["branches"],
) {
  const values = transactionReportFormValues(query, branches);
  const status = query?.status;
  return {
    startDate: values.startDate,
    endDate: values.endDate,
    search: values.search,
    pageSize: String(values.pageSize),
    originBranchId: values.originBranchId,
    destinationBranchId: values.destinationBranchId,
    status: typeof status === "string" && status.length <= 30 ? status : "",
  };
}

export function AwbStatusReportView({
  result,
  query,
}: {
  result: AwbStatusResult;
  query?: DisplayQuery;
}) {
  const kind = result.kind;
  const f = result.parsed.status === "valid" ? result.parsed.filters : null;
  const display = f
    ? {
        startDate: result.allDates ? "" : f.startDate,
        endDate: result.allDates ? "" : f.endDate,
        search: f.search,
        pageSize: String(f.pageSize),
        originBranchId:
          f.originBranchId === null ? "" : String(f.originBranchId),
        status: result.statusFilter ?? "",
        destinationBranchId:
          f.destinationBranchId === null ? "" : String(f.destinationBranchId),
      }
    : displayValues(
        result.state === "invalid" ? query : undefined,
        result.branches,
      );
  const issues = result.parsed.status === "invalid" ? result.parsed.issues : [];
  const ctx: UrlContext = {
    allDates: result.allDates,
    status: result.statusFilter,
  };
  const queryUrl = (
    target: AwbStatusKind,
    filters: TransactionReportFilters | null,
    page = 1,
    path: string = awbStatusRoutes[target],
    paging = true,
  ) => buildUrl(ctx, target, filters, page, path, paging);
  const period = !f
    ? ""
    : result.allDates
      ? "Semua tanggal"
      : `Periode ${f.startDate} sampai ${f.endDate}, UTC`;
  const route = awbStatusRoutes[kind];
  const table = awbStatusTable(result);
  return (
    <div className="min-w-0 space-y-5 [overflow-wrap:anywhere]">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {titles[kind]}
        </h1>
        <p className="max-w-prose text-sm text-muted-foreground">
          {descriptions[kind]}
        </p>
      </header>
      {kind !== "all-status" && (
        <nav aria-label="Tampilan AWB" className="flex flex-wrap gap-4">
          {(["pending", "manifested"] as const).map((view) => (
            <Link
              key={view}
              prefetch={false}
              aria-current={view === kind ? "page" : undefined}
              className={linkClass}
              href={queryUrl(view, null, 1, awbStatusRoutes[view], false)}
            >
              {titles[view]}
            </Link>
          ))}
        </nav>
      )}
      <section
        aria-label="Filter laporan"
        className="rounded-lg border bg-background p-4 sm:p-6"
      >
        <Form action={route} className="space-y-4">
          {kind !== "all-status" && (
            <input type="hidden" name="view" value={kind} />
          )}
          <p id="awb-period-hint" className="text-sm text-muted-foreground">
            {kind === "manifested" ? "Tanggal manifest" : "Tanggal transaksi"}{" "}
            dalam UTC, maksimal 31 hari termasuk kedua tanggal.
            {kind === "pending" &&
              " Kosongkan kedua tanggal untuk menampilkan semua AWB tertunda."}
          </p>
          <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-3 [&>div]:min-w-0">
            <div className="space-y-2">
              <Label htmlFor="awb-start">Tanggal mulai (UTC)</Label>
              <Input
                id="awb-start"
                type="date"
                name="startDate"
                required={kind !== "pending"}
                defaultValue={display.startDate}
                aria-describedby="awb-period-hint"
                className="min-h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="awb-end">Tanggal akhir (UTC)</Label>
              <Input
                id="awb-end"
                type="date"
                name="endDate"
                required={kind !== "pending"}
                defaultValue={display.endDate}
                aria-describedby="awb-period-hint"
                className="min-h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="awb-search">Cari AWB</Label>
              <Input
                id="awb-search"
                name="search"
                maxLength={50}
                defaultValue={display.search}
                className="min-h-11"
              />
            </div>
            {kind === "all-status" && (
              <div className="space-y-2">
                <Label htmlFor="awb-origin">Asal</Label>
                <ComboSelect
                  id="awb-origin"
                  name="originBranchId"
                  defaultValue={display.originBranchId}
                  className={selectClass}
                >
                  <option value="">Semua asal</option>
                  {result.branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </ComboSelect>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="awb-destination">Tujuan</Label>
              <ComboSelect
                id="awb-destination"
                name="destinationBranchId"
                defaultValue={display.destinationBranchId}
                className={selectClass}
              >
                <option value="">Semua tujuan</option>
                {result.branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </ComboSelect>
            </div>
            {kind === "all-status" && (
              <div className="space-y-2">
                <Label htmlFor="awb-status">Status kiriman</Label>
                <ComboSelect
                  id="awb-status"
                  name="status"
                  defaultValue={display.status}
                  className={selectClass}
                >
                  <option value="">Semua status</option>
                  {result.statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </ComboSelect>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="awb-size">Baris per halaman</Label>
              <Input
                id="awb-size"
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
          <OperationalSubmitButton />
        </Form>
      </section>
      {result.state === "initial" && (
        <EmptyState
          title="Pilih periode laporan"
          description="Pilih rentang tanggal UTC lalu tampilkan laporan."
        />
      )}
      {result.state === "ready" && f && (
        <section
          aria-label="Hasil laporan"
          className="min-w-0 rounded-lg border bg-background"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 border-b p-4">
            <div className="space-y-1">
              <h2 className="font-semibold">{titles[kind]}</h2>
              <p className="text-sm text-muted-foreground">{period}</p>
            </div>
            {result.canExport && result.total > 0 && (
              <a
                className={linkClass}
                href={queryUrl(kind, f, 1, awbStatusExportRoutes[kind], false)}
              >
                Unduh CSV (maks. 5000 baris)
              </a>
            )}
          </div>
          {result.totals && (
            <dl className="grid gap-4 border-b p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Total AWB", result.totals.totalAwb],
                ["Total koli", result.totals.totalKoli],
                ["Total berat (kg)", result.totals.totalKilo],
                ...(kind === "all-status"
                  ? []
                  : [["Total volume", result.totals.totalVolume] as const]),
              ].map(([label, value]) => (
                <div key={String(label)} className="space-y-1">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-semibold tabular-nums">
                    {cell(value as string | number | null)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          {result.items.length ? (
            <Table className="min-w-5xl [&_td]:align-top">
              <caption className="sr-only">
                {titles[kind]}. Seluruh waktu menggunakan UTC. Gulir untuk
                membaca semua kolom.
              </caption>
              <TableHeader>
                <TableRow>
                  {table.columns.map((column) => (
                    <TableHead
                      key={column.label}
                      scope="col"
                      className={column.numeric ? "text-right" : undefined}
                    >
                      {column.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.values.map((value, index) => (
                      <TableCell
                        key={table.columns[index].label}
                        className={
                          table.columns[index].numeric
                            ? "text-right tabular-nums"
                            : "min-w-32 max-w-64 whitespace-normal [overflow-wrap:anywhere]"
                        }
                      >
                        {cell(value)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title={result.total ? "Halaman ini kosong" : "Tidak ada data"}
              description={
                result.total
                  ? "Kembali ke halaman pertama atau persempit filter."
                  : "Tidak ada AWB sesuai periode, filter dan cakupan cabang Anda."
              }
              action={
                result.total ? (
                  <Link className={linkClass} href={queryUrl(kind, f, 1)}>
                    Ke halaman pertama
                  </Link>
                ) : undefined
              }
            />
          )}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t p-4 text-sm">
            <p
              aria-live="polite"
              className="text-muted-foreground tabular-nums"
            >
              Menampilkan {result.items.length ? f.skip + 1 : 0}–
              {result.items.length ? f.skip + result.items.length : 0} dari{" "}
              {result.total} baris · Halaman {f.page}
            </p>
            <nav aria-label="Halaman laporan" className="flex flex-wrap gap-4">
              {f.page > 1 && (
                <Link
                  prefetch={false}
                  aria-label="Halaman sebelumnya"
                  className={linkClass}
                  href={queryUrl(kind, f, f.page - 1)}
                >
                  Sebelumnya
                </Link>
              )}
              {f.page < 1000 && f.skip + f.take < result.total && (
                <Link
                  prefetch={false}
                  aria-label="Halaman berikutnya"
                  className={linkClass}
                  href={queryUrl(kind, f, f.page + 1)}
                >
                  Berikutnya
                </Link>
              )}
            </nav>
          </div>
        </section>
      )}
    </div>
  );
}
