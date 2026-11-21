"use client";

import { useEffect } from "react";
import { PrintButton } from "./print-button";

/** Toolbar for print tabs: opens the print dialog once, with a manual retry. */
export function PrintToolbar({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  useEffect(() => {
    // ?preview=1 shows the documents without opening the print dialog.
    if (new URLSearchParams(window.location.search).has("preview")) return;
    const timer = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b bg-background p-4 print:hidden">
      <p className="text-sm">
        {count} dokumen siap dicetak. Pilih printer atau &quot;Simpan sebagai
        PDF&quot;.
      </p>
      <div className="flex gap-2">
        <PrintButton label={label} />
        <button
          type="button"
          onClick={() => window.close()}
          className="min-h-11 rounded-md border px-4 text-sm"
        >
          Tutup tab
        </button>
      </div>
    </div>
  );
}
