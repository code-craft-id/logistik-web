"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Opens the browser print dialog; hidden on the printed page itself. */
export function PrintButton({ label = "Cetak" }: { label?: string }) {
  return (
    <Button
      type="button"
      className="min-h-11 print:hidden"
      onClick={() => window.print()}
    >
      <Printer className="size-4" aria-hidden="true" />
      {label}
    </Button>
  );
}
