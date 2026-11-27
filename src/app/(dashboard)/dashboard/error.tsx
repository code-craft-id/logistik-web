"use client";
import { ErrorState } from "@/components/patterns/content-state";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <ErrorState
      title="Laporan belum dapat dimuat"
      description="Coba muat laporan kembali. Jika masih gagal, hubungi administrator."
      action={
        <Button className="min-h-11" onClick={reset}>
          Coba lagi
        </Button>
      }
    />
  );
}
