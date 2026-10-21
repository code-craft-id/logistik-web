import type { Metadata } from "next";
import { PreviewScreenPage } from "@/components/patterns/preview-screen";
import { screens } from "@/features/master-data/preview/screens";

export const metadata: Metadata = { title: "Shipment Status" };
export default function Page() {
  return <PreviewScreenPage screen={screens["/shipment-status"]} />;
}
