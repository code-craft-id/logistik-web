import type { Metadata } from "next";
import { MenuAccessPreview } from "@/features/identity/components/menu-access-preview";

export const metadata: Metadata = { title: "Hak Akses Menu" };
export default function Page() {
  return <MenuAccessPreview />;
}
