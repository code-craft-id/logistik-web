import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/patterns/content-state";
import { PostingListPage } from "@/features/finance/components/akunting-pages";

export const metadata: Metadata = { title: "Kasir (List Posting)" };
// Query- and session-dependent; blocking render.
export const instant = false;

type Query = Record<string, string | string[] | undefined>;
async function Content({ searchParams }: { searchParams: Promise<Query> }) {
  return <PostingListPage view="posting" query={await searchParams} />;
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
