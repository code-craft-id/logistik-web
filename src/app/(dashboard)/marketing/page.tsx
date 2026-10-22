import type { Metadata } from "next";
import { PreviewScreenPage } from "@/components/patterns/preview-screen";
import { screens } from "@/features/sales/preview/screens";

export const metadata: Metadata = { title: "Pemasaran/Penjualan" };
export default function Page() {
  return <PreviewScreenPage screen={screens["/marketing"]} />;
}
