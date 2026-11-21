import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/patterns/content-state";
import { AwbStatusReportPage } from "@/features/reports/awb-status/components/report-page";

export const metadata: Metadata = { title: "AWB" };
type SearchParams = Promise<Record<string, string | string[] | undefined>>;
export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<LoadingState label="Memuat laporan…" />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
async function Content({ searchParams }: { searchParams: SearchParams }) {
  return <AwbStatusReportPage report="awb" query={await searchParams} />;
}
