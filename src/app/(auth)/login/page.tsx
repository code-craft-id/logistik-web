import type { Metadata } from "next";
import { LoginPreview } from "@/features/identity/components/login-preview";

export const metadata: Metadata = { title: "Masuk Sistem" };
export default function Page() {
  return <LoginPreview />;
}
