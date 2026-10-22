import type { Metadata } from "next";
import { PreviewScreenPage } from "@/components/patterns/preview-screen";
import { screens } from "@/features/ticketing/preview/screens";

export const metadata: Metadata = { title: "Ticketing" };
export default function Page() {
  return <PreviewScreenPage screen={screens["/ticketting"]} />;
}
