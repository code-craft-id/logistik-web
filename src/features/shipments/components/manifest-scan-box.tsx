"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ScanInput,
  scanFeedback,
} from "@/features/modul/components/scan-input";
import { scanKoliAction } from "../manifest-scan-actions";

/** "Masukan No. AWB/Koli No. [ENTER]" for the manifest scan page. */
export function ManifestScanBox({
  manifestId,
  kind,
}: {
  manifestId: number;
  kind: "TRANSIT" | "INBOUND";
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null,
  );
  return (
    <div className="space-y-2">
      <ScanInput
        label="Masukan No. AWB/Koli No."
        busy={pending}
        onCode={(code) =>
          start(async () => {
            try {
              const next = await scanKoliAction(manifestId, kind, code);
              scanFeedback(next.ok);
              setResult(next);
              if (next.ok) router.refresh();
            } catch {
              scanFeedback(false);
              setResult({ ok: false, message: "Koneksi terputus. Coba lagi." });
            }
          })
        }
      />
      {result && (
        <p
          role={result.ok ? "status" : "alert"}
          className={`rounded-md border p-2 text-sm ${result.ok ? "border-primary" : "border-destructive text-destructive"}`}
        >
          {result.message}
        </p>
      )}
    </div>
  );
}
