import type { Metadata } from "next";
import { PreviewScreenPage } from "@/components/patterns/preview-screen";
import { screens } from "@/features/accounting/preview/screens";

export const metadata: Metadata = { title: "Rugi Laba" };
export default function Page() {
  return <PreviewScreenPage screen={screens["/akunting/rugi-laba"]} />;
}
