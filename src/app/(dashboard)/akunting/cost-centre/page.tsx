import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/patterns/content-state";
import { CostCentrePage } from "@/features/finance/components/akunting-pages";

export const metadata: Metadata = { title: "Cost Centre" };
export const instant = false;

export default function Page() {
  return (
    <Suspense fallback={<LoadingState label="Memuat akunting…" />}>
      <CostCentrePage />
    </Suspense>
  );
}
