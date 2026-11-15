import type { TransactionReportFilterResult } from "./filters";

export const transactionReportRoute = "/branch-reports/transaction-details";
export type TransactionReportRow = {
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
};
export type TransactionReportResult = {
  canExport: boolean;
  state: "initial" | "invalid" | "ready";
  parsed: TransactionReportFilterResult;
  branches: { id: number; name: string }[];
  items: TransactionReportRow[];
  total: number;
};
