import type { Metadata } from "next";
import { PreviewScreenPage } from "@/components/patterns/preview-screen";
import { screens } from "@/features/master-data/preview/screens";

export const metadata: Metadata = { title: "Data Vendor" };
export default function Page() {
  return <PreviewScreenPage screen={screens["/vendor"]} />;
}
