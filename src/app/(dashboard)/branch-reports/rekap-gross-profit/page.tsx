import type { Metadata } from "next";
import { SimpleReportPage } from "@/features/reports/simple/report-page";

export const metadata: Metadata = { title: "Rekap Gross Profit" };

// Session- and query-dependent report; blocking render.
export const instant = false;

export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <SimpleReportPage
      id="gross-profit-recap"
      route="/branch-reports/rekap-gross-profit"
      searchParams={searchParams}
    />
  );
}
