import Form from "next/form";
import Link from "next/link";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/patterns/content-state";
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
import type { TransactionReportFilters } from "../../transaction-details/filters";
import { type OperationalReportResult, operationalRoutes } from "../contracts";
import {
  DashboardInsightsView,
  DashboardQuickActions,
} from "./dashboard-insights";
import { OperationalSubmitButton } from "./submit-button";

const titles = {
  manifest: "Manifes Cabang",
  sheets: "Laporan Pengantaran",
  items: "Hasil Pengantaran per Transaksi",
  dashboard: "Dashboard",
  vendor: "Manifest Vendor",
};
const routes = {
  ...operationalRoutes,
  sheets: operationalRoutes.delivery,
  items: operationalRoutes.delivery,
};
function queryUrl(
  route: string,
  f: TransactionReportFilters | null,
  page = 1,
  view?: "sheets" | "items",
  includeSearch = true,
) {
  const query = new URLSearchParams();
  if (f) {
    query.set("startDate", f.startDate);
    query.set("endDate", f.endDate);
    if (f.branchId !== null) query.set("branchId", String(f.branchId));
    if (includeSearch) {
      query.set("pageSize", String(f.pageSize));
      query.set("page", String(page));
      if (f.search) query.set("search", f.search);
    }
  }
  if (view) query.set("view", view);
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
function reportTable(result: OperationalReportResult) {
  if (result.kind === "dashboard" || result.kind === "vendor") return null;
  let headers: string[];
  let rows: { id: number; values: (string | number | null)[] }[];
  if (result.kind === "manifest") {
    headers = [
      "Manifes No.",
      "Tanggal (UTC)",
      "Cabang pemilik",
      "Asal (cabang tersimpan)",
      "Tujuan (cabang tersimpan)",
      "Jenis",
      "Kendaraan",
      "Kurir manifest",
      "Status",
      "Penugasan aktif terlihat",
      "Koli terlihat",
      "Berat terlihat (kg)",
      "Volume terlihat",
    ];
    rows = result.items.map((row) => ({
      id: row.id,
      values: [
        row.manifestNo,
        row.date,
        row.branch,
        row.originBranch,
        row.destinationBranch,
        row.type,
        row.vehicle,
        row.courier,
        row.status,
        row.assignedTransactions,
        row.totalKoli,
        row.totalKilo,
        row.totalVolume,
      ],
    }));
  } else if (result.kind === "sheets") {
    headers = [
      "Tanggal lembar (UTC)",
      "DRS No.",
      "Manifes No.",
      "Cabang pemilik",
      "Kurir manifest",
      "Transaksi terlihat",
      "Koli terlihat",
      "Berat terlihat (kg)",
      "Volume terlihat",
    ];
    rows = result.items.map((row) => ({
      id: row.id,
      values: [
        row.date,
        row.sheetNo,
        row.manifestNo,
        row.branch,
        row.courier,
        row.visibleTransactions,
        row.totalKoli,
        row.totalKilo,
        row.totalVolume,
      ],
    }));
  } else {
    headers = [
      "DRS No.",
      "Tanggal lembar (UTC)",
      "AWB No.",
      "Penerima barang",
      "Hasil tersimpan",
      "Waktu pengantaran selesai (UTC)",
      "Diterima oleh",
      "Catatan",
    ];
    rows = result.items.map((row) => ({
      id: row.id,
      values: [
        row.sheetNo,
        row.date,
        row.awbNo,
        row.receiverName,
        row.outcome,
        row.deliveredAt,
        row.receivedBy,
        row.notes,
      ],
    }));
  }
  return (
    <Table className="min-w-5xl [&_td]:align-top">
      <caption className="sr-only">
        {titles[result.kind]}. Seluruh waktu menggunakan UTC. Gulir untuk
        membaca semua kolom.
      </caption>
      <TableHeader>
        <TableRow>
          {headers.map((header) => (
            <TableHead
              key={header}
              scope="col"
              className={
                header === "Penugasan aktif terlihat" ||
                header === "Transaksi terlihat" ||
                header === "Koli terlihat" ||
                header === "Berat terlihat (kg)" ||
                header === "Volume terlihat"
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
        {rows.map((row) => (
          <TableRow key={row.id}>
            {row.values.map((value, index) => (
              <TableCell
                key={headers[index]}
                className={
                  typeof value === "number" ||
                  [
                    "Koli terlihat",
                    "Berat terlihat (kg)",
                    "Volume terlihat",
                  ].includes(headers[index])
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
  );
}
type DisplayQuery = Record<string, string | string[] | undefined>;
/** Display recovery only; these values never authorize or execute a report query. */
function invalidFormValues(
  query: DisplayQuery | undefined,
  branches: OperationalReportResult["branches"],
) {
  const scalar = (value: unknown, maximum: number) =>
    typeof value === "string" && value.length <= maximum ? value : "";
  const calendar = (value: unknown) => {
    const text = scalar(value, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || text.startsWith("0000")) return "";
    const date = new Date(`${text}T00:00:00.000Z`);
    return Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === text
      ? text
      : "";
  };
  const size = scalar(query?.pageSize, 3);
  const branch = scalar(query?.branchId, 10);
  return {
    startDate: calendar(query?.startDate),
    endDate: calendar(query?.endDate),
    search: scalar(query?.search, 50),
    pageSize: /^[1-9]\d{0,2}$/.test(size) && Number(size) <= 100 ? size : "20",
    branchId:
      /^[1-9]\d{0,9}$/.test(branch) &&
      branches.some((option) => String(option.id) === branch)
        ? branch
        : "",
  };
}
export function OperationalReportView({
  result,
  query,
}: {
  result: OperationalReportResult;
  query?: DisplayQuery;
}) {
  const f = result.parsed.status === "valid" ? result.parsed.filters : null;
  const display =
    f ??
    invalidFormValues(
      result.state === "invalid" ? query : undefined,
      result.branches,
    );
  const issues = result.parsed.status === "invalid" ? result.parsed.issues : [];
  const delivery = result.kind === "sheets" || result.kind === "items";
  const dashboard = result.kind === "dashboard";
  const route = routes[result.kind];
  const view = result.kind === "items" ? "items" : "sheets";
  if (result.kind === "vendor")
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Manifest Vendor
        </h1>
        <EmptyState
          title="Laporan vendor belum tersedia"
          description="Data operasional yang tersedia belum mencatat pengaitan vendor pada manifest. Laporan tidak menebak atribusi vendor."
          action={
            <Link
              className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
              href={operationalRoutes.manifest}
            >
              Lihat Manifes Cabang
            </Link>
          }
        />
      </div>
    );
  return (
    <div className="min-w-0 space-y-5 [overflow-wrap:anywhere]">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {titles[result.kind]}
        </h1>
        <p className="max-w-prose text-sm text-muted-foreground">
          {dashboard
            ? "Ringkasan operasional dalam cakupan cabang Anda. Setiap angka memakai tanggal sumber yang tertulis; status ditampilkan sesuai catatan tersimpan tanpa penggolongan keberhasilan."
            : result.kind === "manifest"
              ? "Satu baris per manifest sesuai jenis dan status tersimpan. Penugasan aktif dan kuantitas hanya mencakup transaksi yang masih ditugaskan dan terlihat dalam cakupan Anda. Kuantitas tidak tersedia jika ada nilai sumber yang belum diketahui. Maksimum 10.000 rincian per halaman."
              : "Laporan atas lembar pengantaran yang sudah tercatat. Periode mengikuti tanggal lembar pengantaran, bukan waktu diterima; hasil ditampilkan sesuai catatan tersimpan. Kuantitas hanya menjumlahkan transaksi terlihat dan tidak tersedia jika ada nilai sumber yang belum diketahui. Maksimum 10.000 rincian per halaman."}
        </p>
        {dashboard && (
          <p className="max-w-prose text-sm text-muted-foreground">
            Transaksi mengikuti cabang asal/tujuan; manifest dan pengantaran
            mengikuti cabang pemilik manifest. Transaksi pengantaran juga
            dibatasi oleh cakupan asal/tujuan Anda.
          </p>
        )}
      </header>
      {delivery && (
        <nav aria-label="Tampilan pengantaran" className="flex flex-wrap gap-4">
          <Link
            prefetch={false}
            aria-current={view === "sheets" ? "page" : undefined}
            className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
            href={queryUrl(route, f, 1, "sheets", false)}
          >
            Per DRS
          </Link>
          <Link
            prefetch={false}
            aria-current={view === "items" ? "page" : undefined}
            className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
            href={queryUrl(route, f, 1, "items", false)}
          >
            Per transaksi
          </Link>
        </nav>
      )}
      <section
        aria-label="Filter laporan"
        className="rounded-lg border bg-background p-4 sm:p-6"
      >
        <Form action={route} className="space-y-4">
          {delivery && <input type="hidden" name="view" value={view} />}
          <p
            id="operational-period-hint"
            className="text-sm text-muted-foreground"
          >
            Pilih tanggal UTC, maksimal 31 hari termasuk kedua tanggal.
          </p>
          <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-3 [&>div]:min-w-0">
            <div className="space-y-2">
              <Label htmlFor="op-start">Tanggal mulai (UTC)</Label>
              <Input
                id="op-start"
                type="date"
                name="startDate"
                required
                defaultValue={display.startDate}
                aria-describedby="operational-period-hint"
                className="min-h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="op-end">Tanggal akhir (UTC)</Label>
              <Input
                id="op-end"
                type="date"
                name="endDate"
                required
                defaultValue={display.endDate}
                aria-describedby="operational-period-hint"
                className="min-h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="op-branch">
                {dashboard ? "Cabang" : "Cabang pemilik manifest"}
              </Label>
              <select
                id="op-branch"
                name="branchId"
                defaultValue={display.branchId ?? ""}
                className="min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
              >
                <option value="">Semua cabang yang diizinkan</option>
                {result.branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            {!dashboard && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="op-search">
                    {result.kind === "manifest"
                      ? "Cari nomor manifest"
                      : view === "items"
                        ? "Cari AWB"
                        : "Cari nomor DRS"}
                  </Label>
                  <Input
                    id="op-search"
                    name="search"
                    maxLength={50}
                    defaultValue={display.search}
                    className="min-h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="op-size">Baris per halaman</Label>
                  <Input
                    id="op-size"
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
              </>
            )}
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
          description="Pilih rentang tanggal UTC dan tampilkan laporan untuk membaca data operasional."
        />
      )}
      {result.state === "ready" &&
        f &&
        (dashboard ? (
          <>
            {result.kind === "dashboard" && result.insights && (
              <DashboardQuickActions actions={result.insights.actions} />
            )}
            <section
              aria-label="Ringkasan hasil"
              className="rounded-lg border bg-background p-4 sm:p-6"
            >
              <h2 className="font-semibold">
                Periode {f.startDate} sampai {f.endDate}, UTC
              </h2>
              <dl className="mt-4 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    key: "transactions",
                    label: "Transaksi",
                    basis: "Tanggal transaksi",
                    value: result.counts?.transactions ?? 0,
                    href: result.links.transaction
                      ? queryUrl(
                          "/branch-reports/transaction-details",
                          f,
                          1,
                          undefined,
                          false,
                        )
                      : null,
                  },
                  {
                    key: "manifests",
                    label: "Manifest",
                    basis: "Tanggal manifest",
                    value: result.counts?.manifests ?? 0,
                    href: result.links.manifest
                      ? queryUrl(
                          operationalRoutes.manifest,
                          f,
                          1,
                          undefined,
                          false,
                        )
                      : null,
                  },
                  {
                    key: "sheets",
                    label: "Lembar pengantaran terlihat",
                    basis: "Tanggal lembar pengantaran",
                    value: result.counts?.sheets ?? 0,
                    href: result.links.delivery
                      ? queryUrl(
                          operationalRoutes.delivery,
                          f,
                          1,
                          "sheets",
                          false,
                        )
                      : null,
                  },
                  {
                    key: "items",
                    label: "Transaksi pengantaran terlihat",
                    basis: "Tanggal lembar pengantaran",
                    value: result.counts?.items ?? 0,
                    href: result.links.delivery
                      ? queryUrl(
                          operationalRoutes.delivery,
                          f,
                          1,
                          "items",
                          false,
                        )
                      : null,
                  },
                ].map((metric) => (
                  <div
                    key={metric.key}
                    className="flex min-w-0 flex-col items-start gap-2"
                  >
                    <dt className="text-sm font-medium xl:min-h-10">
                      {metric.label}
                    </dt>
                    <dd className="text-2xl font-semibold tabular-nums">
                      {metric.value}
                    </dd>
                    <dd className="text-sm text-muted-foreground">
                      {metric.basis} · UTC
                    </dd>
                    {metric.href && (
                      <dd className="mt-auto">
                        <Link
                          prefetch={false}
                          className="inline-flex min-h-11 items-center text-sm text-primary underline underline-offset-4"
                          href={metric.href}
                        >
                          Lihat {metric.label.toLowerCase()}
                        </Link>
                      </dd>
                    )}
                  </div>
                ))}
              </dl>
              {result.kind === "dashboard" && result.insights && (
                <div className="mt-6">
                  <DashboardInsightsView
                    insights={result.insights}
                    filters={f}
                    canOpenAwbReport={result.links.transaction}
                  />
                </div>
              )}
            </section>
          </>
        ) : (
          <section
            aria-label="Hasil laporan"
            className="min-w-0 rounded-lg border bg-background"
          >
            <div className="space-y-1 border-b p-4">
              <h2 className="font-semibold">{titles[result.kind]}</h2>
              <p className="text-sm text-muted-foreground">
                Periode {f.startDate} sampai {f.endDate}, UTC
              </p>
            </div>
            {result.items.length ? (
              reportTable(result)
            ) : (
              <EmptyState
                title={result.total ? "Halaman ini kosong" : "Tidak ada data"}
                description={
                  result.total
                    ? "Kembali ke halaman pertama atau persempit filter."
                    : "Tidak ada data sesuai periode, pencarian dan cakupan cabang Anda."
                }
                action={
                  result.total ? (
                    <Link
                      className="text-primary underline underline-offset-4"
                      href={queryUrl(route, f, 1, delivery ? view : undefined)}
                    >
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
              <nav
                aria-label="Halaman laporan"
                className="flex flex-wrap gap-4"
              >
                {f.page > 1 && (
                  <Link
                    prefetch={false}
                    aria-label="Halaman sebelumnya"
                    className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
                    href={queryUrl(
                      route,
                      f,
                      f.page - 1,
                      delivery ? view : undefined,
                    )}
                  >
                    Sebelumnya
                  </Link>
                )}
                {f.page < 1000 && f.skip + f.take < result.total && (
                  <Link
                    prefetch={false}
                    aria-label="Halaman berikutnya"
                    className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
                    href={queryUrl(
                      route,
                      f,
                      f.page + 1,
                      delivery ? view : undefined,
                    )}
                  >
                    Berikutnya
                  </Link>
                )}
              </nav>
              {f.page === 1000 && f.skip + f.take < result.total && (
                <p className="w-full text-muted-foreground">
                  Batas 1000 halaman tercapai. Persempit periode atau pencarian.
                </p>
              )}
            </div>
          </section>
        ))}
    </div>
  );
}
