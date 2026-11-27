import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/patterns/content-state";
import { VendorTariffPanel } from "@/features/imports/panels";
import { VendorPage } from "@/features/master-data/components/vendor-page";
export const metadata: Metadata = { title: "Data Vendor" };
export default function Page() {
  return (
    <div className="space-y-4">
      <Suspense fallback={null}>
        <VendorTariffPanel />
      </Suspense>
      <Suspense fallback={<LoadingState />}>
        <VendorPage />
      </Suspense>
    </div>
  );
}
