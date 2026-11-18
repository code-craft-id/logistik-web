import type { TransactionReportFilterResult } from "../transaction-details/filters";
export const operationalRoutes = {
  manifest: "/branch-reports/manifest-outbound",
  delivery: "/branch-reports/delivery",
  dashboard: "/dashboard",
  vendor: "/branch-reports/manifest-vendor",
} as const;
export type VisibleQuantities = {
  totalKoli: number | null;
  totalKilo: string | null;
  totalVolume: string | null;
};
export type ManifestReportRow = VisibleQuantities & {
  id: number;
  manifestNo: string;
  date: string;
  branch: string | null;
  originBranch: string | null;
  destinationBranch: string | null;
  type: string | null;
  vehicle: string | null;
  courier: string | null;
  status: string;
  assignedTransactions: number;
};
export type SheetReportRow = VisibleQuantities & {
  id: number;
  sheetNo: string;
  date: string;
  manifestNo: string;
  branch: string | null;
  courier: string | null;
  visibleTransactions: number;
};
export type DeliveryItemReportRow = {
  id: number;
  sheetNo: string;
  date: string;
  awbNo: string | null;
  receiverName: string | null;
  outcome: string | null;
  deliveredAt: string | null;
  receivedBy: string | null;
  notes: string | null;
};
export type DashboardReportCounts = {
  transactions: number;
  manifests: number;
  sheets: number;
  items: number;
};
/** Legacy dashboard widgets with an approved source (D-12, D-22 2026-11-17). */
export type DashboardInsights = {
  /** Legacy Quick Action entries that have an implemented, permitted route. */
  actions: { label: string; href: string }[];
  /** In period, no active manifest assignment (LP-R10 definition). */
  awbPending: number;
  /** AWB count per UTC transaction day across the whole period. */
  daily: { date: string; count: number }[];
  /** Stored transaction status counts in period; no bucket mapping. */
  statuses: { status: string; count: number }[];
  /** Latest created AWBs in scope; null without transaction read rights. */
  recent:
    | {
        id: number;
        awbNo: string | null;
        createdBy: string | null;
        createdAt: string;
      }[]
    | null;
  /** Current ISSUED invoice balances (FIN-01 derivation); null without invoice:view. */
  invoices: {
    unpaid: number;
    partial: number;
    paid: number;
    outstanding: string;
  } | null;
};
type Common = {
  state: "initial" | "invalid" | "ready" | "unavailable";
  parsed: TransactionReportFilterResult;
  branches: { id: number; name: string }[];
  total: number;
  links: { manifest: boolean; delivery: boolean; transaction: boolean };
};
export type OperationalReportResult = Common &
  (
    | { kind: "manifest"; items: ManifestReportRow[] }
    | { kind: "sheets"; items: SheetReportRow[] }
    | { kind: "items"; items: DeliveryItemReportRow[] }
    | {
        kind: "dashboard";
        items: never[];
        counts: DashboardReportCounts | null;
        insights?: DashboardInsights | null;
      }
    | { kind: "vendor"; items: never[] }
  );
