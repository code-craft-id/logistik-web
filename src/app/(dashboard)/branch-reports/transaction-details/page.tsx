import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/patterns/content-state";
import { TransactionReportPage } from "@/features/reports/transaction-details/components/report-page";

export const metadata: Metadata = { title: "Detail Transaksi" };
export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<LoadingState label="Memuat laporan transaksi…" />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
async function Content({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <TransactionReportPage query={await searchParams} />;
}
