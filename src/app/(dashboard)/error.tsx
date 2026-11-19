"use client";

import Link from "next/link";
import { EmptyState } from "@/components/patterns/content-state";
import { Button } from "@/components/ui/button";

/** Fallback so a failed page never renders blank. */
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <EmptyState
      title="Halaman tidak bisa ditampilkan"
      description="Terjadi kesalahan saat memuat halaman ini. Coba lagi; jika berulang, hubungi admin."
      action={
        <div className="flex flex-wrap gap-2">
          <Button onClick={reset} className="min-h-11">
            Coba lagi
          </Button>
          <Button asChild variant="outline" className="min-h-11">
            <Link href="/dashboard">Ke Dashboard</Link>
          </Button>
        </div>
      }
    />
  );
}
