import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/patterns/content-state";
import { OperationalReportPage } from "@/features/reports/operational/components/report-page";
export const metadata: Metadata = { title: "Laporan Pengantaran" };
export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<LoadingState label="Memuat laporan…" />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
async function Content({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <OperationalReportPage kind="delivery" query={await searchParams} />;
}
