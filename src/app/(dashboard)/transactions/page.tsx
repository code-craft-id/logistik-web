import type { Metadata } from "next";
import { PreviewScreenPage } from "@/components/patterns/preview-screen";
import { screens } from "@/features/shipments/preview/screens";

export const metadata: Metadata = { title: "On Site Outbound" };
export default function Page() {
  return <PreviewScreenPage screen={screens["/transactions"]} />;
}
