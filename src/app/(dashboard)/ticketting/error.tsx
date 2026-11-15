"use client";
import { ErrorState } from "@/components/patterns/content-state";
import { Button } from "@/components/ui/button";
export default function TicketError({ reset }: { reset: () => void }) {
  return (
    <ErrorState
      title="Tiket belum dapat dimuat"
      description="Coba kembali. Jika masalah berlanjut, hubungi administrator."
      action={
        <Button onClick={reset} variant="outline" className="min-h-11">
          Coba kembali
        </Button>
      }
    />
  );
}
