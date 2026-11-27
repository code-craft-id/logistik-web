import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/patterns/content-state";
import { GeneralJournalPage } from "@/features/finance/components/akunting-pages";

export const metadata: Metadata = { title: "Bukti Jurnal Umum" };
// Query- and session-dependent; blocking render.
export const instant = false;

type Query = Record<string, string | string[] | undefined>;
async function Content({ searchParams }: { searchParams: Promise<Query> }) {
  return <GeneralJournalPage query={await searchParams} />;
}
export default function Page({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  return (
    <Suspense fallback={<LoadingState label="Memuat akunting…" />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
