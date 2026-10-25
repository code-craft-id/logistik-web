import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/patterns/content-state";
import { MasterDataPage } from "@/features/master-data/components/master-data-page";
export const metadata: Metadata = { title: "Layanan Vendor" };
export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <MasterDataPage title="Layanan Vendor" kinds={["vendor_service"]} />
    </Suspense>
  );
}
