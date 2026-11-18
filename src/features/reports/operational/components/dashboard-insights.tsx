import Link from "next/link";
import type { TransactionReportFilters } from "../../transaction-details/filters";
import type { DashboardInsights } from "../contracts";

const panel = "min-w-0 rounded-lg border bg-background p-4 sm:p-6";
const link =
  "inline-flex min-h-11 items-center text-sm text-primary underline underline-offset-4";

function period(f: TransactionReportFilters) {
  return new URLSearchParams({ startDate: f.startDate, endDate: f.endDate });
}

/** Legacy Quick Action row: implemented, permitted routes only. */
export function DashboardQuickActions({
  actions,
}: {
  actions: DashboardInsights["actions"];
}) {
  return (
    <section aria-labelledby="dash-actions" className={panel}>
      <h2 id="dash-actions" className="font-semibold">
        Quick Action
      </h2>
      {actions.length ? (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((action) => (
            <li key={action.href}>
              <Link
                prefetch={false}
                href={action.href}
                className="flex min-h-11 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {action.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          Belum ada menu yang dapat Anda buka dari sini.
        </p>
      )}
    </section>
  );
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
  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-2">
      <section aria-labelledby="dash-pending" className={panel}>
        <h2 id="dash-pending" className="font-semibold">
          AWB Pending
        </h2>
        <p className="mt-2 text-3xl font-semibold tabular-nums">
          {insights.awbPending}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Transaksi dalam periode tanpa penugasan manifest aktif · tanggal
          transaksi, UTC
        </p>
        {canOpenAwbReport && (
          <Link
            prefetch={false}
            className={link}
            href={`/branch-reports/awb?${pendingQuery}`}
          >
            Lihat AWB pending
          </Link>
        )}
      </section>

      <section aria-labelledby="dash-invoice" className={panel}>
        <h2 id="dash-invoice" className="font-semibold">
          Invoice Outstanding &amp; Piutang
        </h2>
        {insights.invoices ? (
          <>
            <dl className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-muted-foreground">
                  Invoice outstanding
                </dt>
                <dd className="text-2xl font-semibold tabular-nums">
                  {insights.invoices.unpaid + insights.invoices.partial}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-sm text-muted-foreground">Piutang</dt>
                <dd className="text-2xl font-semibold tabular-nums">
                  IDR {insights.invoices.outstanding}
                </dd>
              </div>
            </dl>
            <p className="mt-2 text-sm text-muted-foreground">
              Belum dibayar {insights.invoices.unpaid} · Sebagian{" "}
              {insights.invoices.partial} · Lunas {insights.invoices.paid}.
              Saldo saat ini atas invoice terbit, tidak mengikuti periode.
            </p>
            <Link prefetch={false} className={link} href="/finance/invoices">
              Lihat invoice
            </Link>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Ringkasan invoice hanya tampil bagi pengguna dengan hak lihat
            invoice.
          </p>
        )}
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
              return (
                <li key={row.status} className="space-y-1">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="min-w-0">{row.status}</span>
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
                    {row.createdAt.slice(0, 16).replace("T", " ")} UTC
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

      <section
        aria-labelledby="dash-unavailable"
        className={`${panel} lg:col-span-2`}
      >
        <h2 id="dash-unavailable" className="font-semibold">
          Belum tersedia
        </h2>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Nominal transaksi, CASH/KREDIT/COD/TRANSFER, grafik penjualan, top
          customer, POD outstanding, failed/return, rekomendasi otomatis dan
          pengumuman menunggu aturan sumber yang disetujui (D-11, D-15, D-22).
          Dashboard tidak menebak angka tersebut.
        </p>
      </section>
    </div>
  );
}
