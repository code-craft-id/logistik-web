import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/patterns/content-state";
import { MasterDataPage } from "@/features/master-data/components/master-data-page";
export const metadata: Metadata = { title: "Layanan Logistik" };
export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="space-y-8">
      <Suspense fallback={<LoadingState />}>
        <MasterDataPage
          searchParams={searchParams}
          title="Layanan Logistik"
          kinds={[
            "transport_mode",
            "service_category",
            "delivery_service",
            "goods_type",
            "cost_type",
            "term",
          ]}
        />
      </Suspense>
    </div>
  );
}
