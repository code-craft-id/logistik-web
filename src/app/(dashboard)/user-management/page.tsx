import type { Metadata } from "next";
import { PreviewScreenPage } from "@/components/patterns/preview-screen";
import { screens } from "@/features/identity/preview/screens";

export const metadata: Metadata = { title: "Manajemen User" };
export default function Page() {
  return <PreviewScreenPage screen={screens["/user-management"]} />;
}
