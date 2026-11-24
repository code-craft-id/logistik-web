import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/patterns/content-state";
import { ProfitLossMasterPage } from "@/features/finance/components/akunting-pages";

export const metadata: Metadata = { title: "Master Rugi Laba" };
export const instant = false;

export default function Page() {
  return (
    <Suspense fallback={<LoadingState label="Memuat akunting…" />}>
      <ProfitLossMasterPage />
    </Suspense>
  );
}
