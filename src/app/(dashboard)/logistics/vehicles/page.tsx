import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/patterns/content-state";
import { MasterDataPage } from "@/features/master-data/components/master-data-page";
export const metadata: Metadata = { title: "Kendaraan Logistik" };
export default function Page() {
  return (
    <div className="space-y-8">
      <Suspense fallback={<LoadingState />}>
        <MasterDataPage
          title="Kendaraan Logistik"
          kinds={["vehicle_type", "vehicle", "trucking_type"]}
        />
      </Suspense>
    </div>
  );
}
