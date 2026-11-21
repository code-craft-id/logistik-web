import type { Metadata } from "next";
import { SimpleReportPage } from "@/features/reports/simple/report-page";

export const metadata: Metadata = { title: "Detail Transaksi Inbound" };

// Session- and query-dependent report; blocking render.
export const instant = false;

export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <SimpleReportPage
      id="inbound"
      route="/branch-reports/inbound-transaction-details"
      searchParams={searchParams}
    />
  );
}
