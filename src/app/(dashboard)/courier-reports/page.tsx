import type { Metadata } from "next";
import { PreviewScreenPage } from "@/components/patterns/preview-screen";
import { screens } from "@/features/reports/preview/screens";

export const metadata: Metadata = { title: "Laporan Kurir" };
export default function Page() {
  return <PreviewScreenPage screen={screens["/courier-reports"]} />;
}
