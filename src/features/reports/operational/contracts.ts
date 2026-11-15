import type { TransactionReportFilterResult } from "../transaction-details/filters";
export const operationalRoutes = {
  manifest: "/branch-reports/manifest-outbound",
  delivery: "/branch-reports/delivery",
  dashboard: "/dashboard",
  vendor: "/branch-reports/manifest-vendor",
} as const;
export type ManifestReportRow = {
  id: number;
  manifestNo: string;
  date: string;
  branch: string | null;
  type: string | null;
  vehicle: string | null;
  courier: string | null;
  status: string;
  assignedTransactions: number;
};
export type SheetReportRow = {
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
      }
    | { kind: "vendor"; items: never[] }
  );
