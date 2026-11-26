import Link from "next/link";
import { businessDateTimeString } from "@/lib/date/business-date";
import { formatRupiah } from "@/lib/format/rupiah";
import type { TransactionReportFilters } from "../../transaction-details/filters";
import type { DashboardInsights } from "../contracts";
import {
  changePercent,
  executiveSummary,
  statusBuckets,
} from "../dashboard-summary";
import { DashboardDailyChart } from "./dashboard-daily-chart";

export { DashboardQuickActions } from "./dashboard-quick-actions";

const panel = "min-w-0 rounded-lg border bg-background p-4 sm:p-6";
const link =
  "inline-flex min-h-11 items-center text-sm text-primary underline underline-offset-4";

function period(f: TransactionReportFilters) {
  return new URLSearchParams({ startDate: f.startDate, endDate: f.endDate });
}

/** Legacy dashboard widgets backed by approved sources only (D-12, D-22). */
export function DashboardInsightsView({
  insights,
  filters,
  canOpenAwbReport,
}: {
  insights: DashboardInsights;
  filters: TransactionReportFilters;
  canOpenAwbReport: boolean;
}) {
  const total = insights.statuses.reduce((sum, row) => sum + row.count, 0);
  const pendingQuery = period(filters);
  if (filters.branchId !== null)
    pendingQuery.set("branchId", String(filters.branchId));
  const a = insights.analytics;
  const buckets = statusBuckets(insights.statuses);
  const outstandingInvoices = insights.invoices
    ? insights.invoices.unpaid + insights.invoices.partial
    : null;
  const summary = executiveSummary({
    buckets,
    awbPending: insights.awbPending,
    podOutstanding: a?.podOutstanding.total ?? 0,
    invoicesOutstanding: outstandingInvoices,
    amountText: a ? formatRupiah(a.amount) : null,
    topCustomer: a?.topCustomers[0]
      ? {
          name: a.topCustomers[0].name,
          amountText: formatRupiah(a.topCustomers[0].amount),
        }
      : null,
  });
  const withQuery = (path: string, extra: Record<string, string> = {}) => {
    const q = new URLSearchParams(pendingQuery);
    for (const [k, v] of Object.entries(extra)) q.set(k, v);
    return `${path}?${q}`;
  };
  const alerts: {
    label: string;
    value: string;
    href: string | null;
    warn: boolean;
  }[] = [
    {
      label: "AWB Pending",
      value: String(insights.awbPending),
      href: canOpenAwbReport
        ? withQuery("/branch-reports/awb", { view: "pending" })
        : null,
      warn: insights.awbPending > 0,
    },
    {
      label: "Failed / Return",
      value: String(buckets.failedReturn),
      href: canOpenAwbReport
        ? withQuery("/customer-reports/all-status", { status: "Returned" })
        : null,
      warn: buckets.failedReturn > 0,
    },
    ...(a
      ? [
          {
            label: "POD Outstanding",
            value: String(a.podOutstanding.total),
            href: "/pod-returns",
            warn: a.podOutstanding.total > 0,
          },
        ]
      : []),
    ...(insights.invoices
      ? [
          {
            label: "Invoice Outstanding",
            value: String(outstandingInvoices),
            href: "/finance/invoices",
            warn: (outstandingInvoices ?? 0) > 0,
          },
          {
            label: "Piutang",
            value: formatRupiah(insights.invoices.outstanding),
            href: "/financial-reports/aging",
            warn: Number(insights.invoices.outstanding) > 0,
          },
        ]
      : []),
  ];
  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-2 xl:grid-cols-3">
      <section aria-labelledby="dash-summary" className={panel}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="dash-summary" className="font-semibold">
            Ringkasan Eksekutif
          </h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            Berbasis aturan
          </span>
        </div>
        <ul className="mt-3 space-y-2 text-sm">
          {summary.lines.map((line) => (
            <li key={line} className="rounded-md bg-muted/50 px-3 py-2">
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="dash-reco" className={panel}>
        <h2 id="dash-reco" className="font-semibold">
          Rekomendasi
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Prioritas tindakan dari angka periode ini
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
          {summary.recommendations.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="dash-alerts"
        className={`${panel} lg:col-span-2 xl:col-span-1`}
      >
        <h2 id="dash-alerts" className="font-semibold">
          Notifikasi Penting
        </h2>
        <ul className="mt-3 divide-y text-sm">
          {alerts.map((item) => {
            const body = (
              <>
                <span>{item.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                    item.warn
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {item.value}
                </span>
              </>
            );
            return (
              <li key={item.label}>
                {item.href ? (
                  <Link
                    prefetch={false}
                    href={item.href}
                    className="flex min-h-11 items-center justify-between gap-3 rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="flex min-h-11 items-center justify-between gap-3">
                    {body}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {a && (
        <section
          aria-labelledby="dash-analytics"
          className={`${panel} lg:col-span-2 xl:col-span-3`}
        >
          <h2 id="dash-analytics" className="font-semibold">
            Analytics &amp; Nominal Transaksi
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Grand Total AWB menurut tanggal transaksi · pembayaran menurut Jenis
            Biaya · perbandingan dengan periode sebelumnya yang sama panjang
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <Tile
              label="Total Transaksi"
              value={formatRupiah(a.amount)}
              change={changePercent(a.amount, a.previous.amount)}
              wide
            />
            <Tile label="CASH" value={formatRupiah(a.payments.cash)} />
            <Tile label="KREDIT" value={formatRupiah(a.payments.kredit)} />
            <Tile label="COD" value={formatRupiah(a.payments.cod)} />
            <Tile label="TRANSFER" value={formatRupiah(a.payments.transfer)} />
            {a.payments.other !== "0.00" && (
              <Tile label="Lainnya" value={formatRupiah(a.payments.other)} />
            )}
            <Tile
              label="Jumlah AWB"
              value={a.awb.toLocaleString("id-ID")}
              change={changePercent(a.awb, a.previous.awb)}
            />
            <Tile label="Rata-rata / AWB" value={formatRupiah(a.average)} />
            <Tile
              label="Customer Aktif"
              value={a.activeCustomers.toLocaleString("id-ID")}
            />
          </dl>
        </section>
      )}

      <section
        aria-label="Grafik transaksi"
        className={`${panel} lg:col-span-2`}
      >
        <DashboardDailyChart days={insights.daily} />
      </section>

      <section aria-labelledby="dash-status" className={panel}>
        <h2 id="dash-status" className="font-semibold">
          Shipment Status
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Status tersimpan transaksi dalam periode · total {total}
        </p>
        {insights.statuses.length ? (
          <ul className="mt-3 space-y-3">
            {insights.statuses.map((row) => {
              const share = total ? (row.count / total) * 100 : 0;
              const statusQuery = new URLSearchParams(pendingQuery);
              statusQuery.set("status", row.status);
              return (
                <li key={row.status} className="space-y-1">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="min-w-0">
                      {canOpenAwbReport && row.status.trim() ? (
                        <Link
                          prefetch={false}
                          href={`/customer-reports/all-status?${statusQuery}`}
                          className="underline underline-offset-4 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {row.status}
                          <span className="sr-only">
                            {" "}
                            — lihat AWB dengan status ini
                          </span>
                        </Link>
                      ) : (
                        row.status || "(status kosong)"
                      )}
                    </span>
                    <span className="tabular-nums">
                      {row.count} ({share.toFixed(2)}%)
                    </span>
                  </div>
                  <div
                    aria-hidden="true"
                    className="h-2 overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Tidak ada transaksi dalam periode ini.
          </p>
        )}
      </section>

      <section aria-labelledby="dash-recent" className={panel}>
        <h2 id="dash-recent" className="font-semibold">
          Aktivitas Terbaru
        </h2>
        {insights.recent === null ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Aktivitas AWB hanya tampil bagi pengguna dengan hak lihat transaksi.
          </p>
        ) : insights.recent.length ? (
          <ul className="mt-3 divide-y">
            {insights.recent.map((row) => (
              <li key={row.id} className="py-2 text-sm">
                <p className="font-medium">
                  AWB #{row.awbNo ?? "tanpa nomor"} dibuat
                </p>
                <p className="text-muted-foreground">
                  Oleh: {row.createdBy ?? "tidak tercatat"} ·{" "}
                  <time dateTime={row.createdAt}>
                    {businessDateTimeString(row.createdAt)} Asia/Jakarta
                  </time>
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Belum ada AWB dalam cakupan Anda.
          </p>
        )}
      </section>

      {a && (
        <section aria-labelledby="dash-top" className={panel}>
          <h2 id="dash-top" className="font-semibold">
            Top 5 Customer
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Revenue periode ini vs periode sebelumnya
          </p>
          {a.topCustomers.length ? (
            <ol className="mt-3 divide-y text-sm">
              {a.topCustomers.map((c, i) => {
                const change = changePercent(c.amount, c.previous);
                return (
                  <li
                    key={`${c.name}-${i}`}
                    className="flex items-start justify-between gap-3 py-2"
                  >
                    <span className="min-w-0 font-medium">
                      {i + 1}. {c.name}
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block tabular-nums">
                        {formatRupiah(c.amount)}
                      </span>
                      <Change value={change} />
                    </span>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Belum ada transaksi customer dalam periode ini.
            </p>
          )}
          <Link prefetch={false} className={link} href="/marketing/revenue">
            Lihat semua customer
          </Link>
        </section>
      )}

      {a && (
        <section aria-labelledby="dash-pod" className={panel}>
          <h2 id="dash-pod" className="font-semibold">
            POD Outstanding
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            AWB Delivered dalam periode yang belum masuk POD Kembali, per cabang
            tujuan · total {a.podOutstanding.total}
          </p>
          {a.podOutstanding.rows.length ? (
            <ul className="mt-3 divide-y text-sm">
              {a.podOutstanding.rows.map((r) => (
                <li
                  key={r.destination}
                  className="flex justify-between gap-3 py-2"
                >
                  <span className="min-w-0">{r.destination}</span>
                  <span className="tabular-nums font-semibold">{r.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Semua POD sudah kembali.
            </p>
          )}
          <Link prefetch={false} className={link} href="/pod-returns">
            Lihat POD Kembali
          </Link>
        </section>
      )}
    </div>
  );
}

function Change({ value }: { value: number | null }) {
  if (value === null)
    return (
      <span className="block text-xs text-muted-foreground">
        Tidak ada data sebelumnya
      </span>
    );
  const up = value >= 0;
  return (
    <span
      className={`block text-xs tabular-nums ${up ? "text-primary" : "text-destructive"}`}
    >
      {up ? "+" : ""}
      {value.toLocaleString("id-ID", { maximumFractionDigits: 1 })}% vs periode
      lalu
    </span>
  );
}

function Tile({
  label,
  value,
  change,
  wide = false,
}: {
  label: string;
  value: string;
  change?: number | null;
  wide?: boolean;
}) {
  return (
    <div
      className={`min-w-0 rounded-md border p-3 ${wide ? "col-span-2 sm:col-span-1" : ""}`}
    >
      <dt className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-base font-semibold tabular-nums [overflow-wrap:anywhere] sm:text-lg">
        {value}
      </dd>
      {change !== undefined && (
        <dd>
          <Change value={change} />
        </dd>
      )}
    </div>
  );
}
