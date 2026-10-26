import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/patterns/content-state";
import { MasterDataPage } from "@/features/master-data/components/master-data-page";
export const metadata: Metadata = { title: "Shipment Status" };
export default function Page() {
  return (
    <div className="space-y-8">
      <Suspense fallback={<LoadingState />}>
        <MasterDataPage title="Shipment Status" kinds={["shipment_status"]} />
      </Suspense>
    </div>
  );
}
