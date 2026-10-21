import type { Metadata } from "next";
import { PreviewScreenPage } from "@/components/patterns/preview-screen";
import { screens } from "@/features/accounting/preview/screens";

export const metadata: Metadata = { title: "Kategori Akun" };
export default function Page() {
  return <PreviewScreenPage screen={screens["/akunting/kategori-akun"]} />;
}
