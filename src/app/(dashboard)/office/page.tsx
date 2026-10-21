import type { Metadata } from "next";
import { PreviewScreenPage } from "@/components/patterns/preview-screen";
import { screens } from "@/features/organization/preview/screens";

export const metadata: Metadata = { title: "Kantor" };
export default function Page() {
  return <PreviewScreenPage screen={screens["/office"]} />;
}
