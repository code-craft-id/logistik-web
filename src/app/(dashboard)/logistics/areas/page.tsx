import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/patterns/content-state";
import { MasterDataPage } from "@/features/master-data/components/master-data-page";
export const metadata: Metadata = { title: "Area Logistik" };
export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <MasterDataPage
        title="Area Logistik"
        kinds={["province", "regency", "district", "village", "postal_code"]}
      />
    </Suspense>
  );
}
