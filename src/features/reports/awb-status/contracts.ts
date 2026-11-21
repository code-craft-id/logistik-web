import type { TransactionReportFilterResult } from "../transaction-details/filters";

/**
 * LP-R10 (AWB Tertunda), LP-R11 (AWB Termanifest) and LP-R21 (Semua Status).
 * Definitions recorded in docs/PRD.md D-22 (2026-11-17). Transaction grain only.
 */
export type AwbStatusKind = "pending" | "manifested" | "all-status";
export const awbStatusRoutes = {
  pending: "/branch-reports/awb",
  manifested: "/branch-reports/awb",
  "all-status": "/customer-reports/all-status",
} as const;
export const awbStatusExportRoutes = {
  pending: "/branch-reports/awb/export",
  manifested: "/branch-reports/awb/export",
  "all-status": "/customer-reports/all-status/export",
} as const;

export type AwbStatusTotals = {
  totalAwb: number;
  totalKoli: number | null;
  totalKilo: string | null;
  totalVolume: string | null;
};
export type AwbPendingRow = {
  id: number;
  awbNo: string | null;
  doNo: string | null;
  transactionDate: string;
  originBranch: string | null;
  destinationBranch: string | null;
  koli: number | null;
  kilo: string | null;
  volume: string | null;
};
export type AwbManifestedRow = {
  id: number;
  awbNo: string | null;
  doNo: string | null;
  manifestNo: string;
  manifestDate: string;
  destinationBranch: string | null;
  koli: number | null;
  kilo: string | null;
  volume: string | null;
};
export type AllStatusRow = {
  id: number;
  awbNo: string | null;
  transactionDate: string;
  originBranch: string | null;
  destinationBranch: string | null;
  senderName: string | null;
  receiverName: string | null;
  koli: number | null;
  kilo: string | null;
  status: string;
  receivedBy: string | null;
  deliveredAt: string | null;
  manifestNo: string | null;
};
type Common = {
  state: "initial" | "invalid" | "ready";
  parsed: TransactionReportFilterResult;
  branches: { id: number; name: string }[];
  /** Stored statuses visible in the actor's scope (LP-R21 filter options). */
  statuses: string[];
  statusFilter: string | null;
  allDates: boolean;
  canExport: boolean;
  total: number;
  totals: AwbStatusTotals | null;
};
export type AwbStatusResult = Common &
  (
    | { kind: "pending"; items: AwbPendingRow[] }
    | { kind: "manifested"; items: AwbManifestedRow[] }
    | { kind: "all-status"; items: AllStatusRow[] }
  );
