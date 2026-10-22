import type { Metadata } from "next";
import { PreviewScreenPage } from "@/components/patterns/preview-screen";
import { screens } from "@/features/reports/preview/screens";

export const metadata: Metadata = { title: "Detail Transaksi" };
export default function Page() {
  return (
    <PreviewScreenPage
      screen={screens["/branch-reports/transaction-details"]}
    />
  );
}
