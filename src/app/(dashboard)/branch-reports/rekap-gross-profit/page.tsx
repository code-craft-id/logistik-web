import type { Metadata } from "next";
import { PreviewScreenPage } from "@/components/patterns/preview-screen";
import { screens } from "@/features/reports/preview/screens";

export const metadata: Metadata = { title: "Rekap Gross Profit" };
export default function Page() {
  return (
    <PreviewScreenPage screen={screens["/branch-reports/rekap-gross-profit"]} />
  );
}
