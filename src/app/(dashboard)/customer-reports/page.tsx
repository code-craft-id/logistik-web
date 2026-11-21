import type { Metadata } from "next";
import Link from "next/link";
import { PreviewScreenPage } from "@/components/patterns/preview-screen";
import { screens } from "@/features/reports/preview/screens";

export const metadata: Metadata = { title: "Customer Reports" };
export default function Page() {
  return (
    <div className="space-y-4">
      <p className="rounded-lg border bg-background p-4 text-sm">
        Laporan <strong>Semua Status</strong> sudah memakai data nyata.{" "}
        <Link
          href="/customer-reports/all-status"
          className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
        >
          Buka Semua Status
        </Link>
      </p>
      <PreviewScreenPage screen={screens["/customer-reports"]} />
    </div>
  );
}
