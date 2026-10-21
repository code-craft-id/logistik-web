import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  Banknote,
  CalendarDays,
  ChartColumn,
  CircleCheck,
  ClipboardList,
  CreditCard,
  FileText,
  type LucideIcon,
  Receipt,
  RefreshCw,
  ShoppingCart,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { DashboardPanel } from "@/components/patterns/dashboard-panel";
import { PageHeading } from "@/components/patterns/page-heading";
import { Button } from "@/components/ui/button";
import { DashboardFilters } from "./dashboard-filters";

const quickActions = [
  { title: "Booking", icon: CalendarDays, items: ["Booking"] },
  {
    title: "Transaksi",
    icon: RefreshCw,
    items: ["Entry AWB", "Shipment Status", "Tracking AWB"],
  },
  {
    title: "Manifest",
    icon: ClipboardList,
    items: ["Manifest", "Transit", "Inbound Manifest"],
  },
  { title: "Delivery Sheet", icon: Truck, items: ["Delivery Sheet"] },
  { title: "Invoice", icon: FileText, items: ["Invoice", "Invoice Paid"] },
  {
    title: "Laporan",
    icon: ChartColumn,
    items: ["Report Detail Transaksi", "Rekap Transaksi", "Report AR"],
  },
];

const branchMetrics: readonly [string, string, LucideIcon][] = [
  ["Omset Bulan Ini", "Total Cash", Banknote],
  ["Omset Bulan Ini", "Total Kredit", CreditCard],
  ["Total Piutang", "Total Piutang", Receipt],
  ["Penjualan Bulan Ini", "Total", ShoppingCart],
  ["AWB Uninvoice Bulan Ini", "AWB", FileText],
  ["AWB Invoiced Bulan Ini", "AWB", CircleCheck],
];
const operationalMetrics: readonly [string, string, LucideIcon][] = [
  ["AWB Belum Termanifest", "AWB", ClipboardList],
  ["AWB Belum Inbound", "AWB", ArrowDownToLine],
  ["AWB Belum Masuk DRS", "AWB", Truck],
  ["POD Kembali Tujuan", "AWB", ArrowRight],
  ["POD Kembali Asal", "AWB", ArrowLeft],
];

function MetricGroup({
  title,
  metrics,
}: {
  title: string;
  metrics: readonly (readonly [string, string, LucideIcon])[];
}) {
  return (
    <section aria-label={title}>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-1 mb-4 text-sm text-muted-foreground">
        Data unavailable. Approved operational sources are not connected.
      </p>
      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map(([label, detail, Icon]) => (
          <div
            key={`${label}-${detail}`}
            className="rounded-xl border bg-background p-5"
          >
            <dt className="flex items-start justify-between gap-3 text-sm">
              <span>
                <span className="block font-medium">{label}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {detail}
                </span>
              </span>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                <Icon className="size-4" aria-hidden="true" />
              </span>
            </dt>
            <dd className="mt-4 text-lg font-semibold text-muted-foreground">
              Unavailable
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function UnavailableChart({ description }: { description: string }) {
  return (
    <div className="flex min-h-60 items-center justify-center rounded-lg bg-muted/50 p-6 text-center">
      <div className="max-w-prose space-y-2">
        <p className="text-sm font-medium">Chart unavailable</p>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function DashboardOverview() {
  return (
    <>
      <PageHeading
        title="Dashboard"
        description="Ringkasan aktivitas cabang & operasional"
        action={
          <Button asChild variant="outline" className="min-h-11">
            <Link href="/ui-examples">
              UI examples
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />
      <p className="rounded-lg border bg-background px-4 py-3 text-sm leading-6 text-muted-foreground">
        UI preview · Legacy dashboard layout. Operational data, account access
        and workflow destinations are unavailable. No records are loaded or
        saved.
      </p>
      <DashboardPanel title="Filter">
        <DashboardFilters />
      </DashboardPanel>
      <DashboardPanel
        title="Quick Action"
        description="Akses cepat menu favorit Anda · Destinations unavailable until their feature is implemented."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {quickActions.map(({ title, icon: Icon, items }) => (
            <section
              key={title}
              aria-label={`${title} quick actions`}
              className="min-w-0 rounded-xl border p-4"
            >
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                {title}
              </h3>
              <ul className="flex flex-wrap gap-2">
                {items.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border bg-muted/50 px-3 py-2 text-xs text-muted-foreground"
                  >
                    {item}
                    <span className="sr-only"> — unavailable</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DashboardPanel>
      <MetricGroup title="Dashboard Admin Cabang" metrics={branchMetrics} />
      <MetricGroup title="Dashboard Operasional" metrics={operationalMetrics} />
      <DashboardPanel
        title="Grafik Transaksi Per Bulan"
        description="CASH · KREDIT · COD · TUNAI - TRANSFER"
      >
        <UnavailableChart description="Monthly transactions require an approved reporting query and date basis. No totals are calculated in this preview." />
      </DashboardPanel>
      <div className="grid gap-4 xl:grid-cols-3">
        <DashboardPanel title="Rekap Penjualan Per Bulan">
          <UnavailableChart description="Sales summaries require approved revenue and costing definitions." />
        </DashboardPanel>
        <DashboardPanel title="Paid Unpaid Invoice">
          <UnavailableChart description="Invoice totals require the approved invoice lifecycle and payment integration." />
        </DashboardPanel>
        <DashboardPanel title="Grafik Penjualan Harian">
          <UnavailableChart description="Daily sales require an approved date basis, branch scope and source query." />
        </DashboardPanel>
      </div>
    </>
  );
}
