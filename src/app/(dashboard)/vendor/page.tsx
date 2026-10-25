import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/patterns/content-state";
import { VendorPage } from "@/features/master-data/components/vendor-page";
export const metadata: Metadata = { title: "Data Vendor" };
export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <VendorPage />
    </Suspense>
  );
}
