"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { importAwbsAction } from "../awb-import-actions";

/** AWB Template Import and Import Data (provider's Kelola On Site buttons). */
export function AwbImportTools() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string }>();
  return (
    <details className="rounded-lg border bg-background p-4">
      <summary className="min-h-11 cursor-pointer py-2 font-medium">
        Import AWB dari Excel
      </summary>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          setBusy(true);
          setResult(undefined);
          try {
            const response = await importAwbsAction(new FormData(form));
            setResult(response);
            if (response.ok) form.reset();
          } catch {
            setResult({
              ok: false,
              message:
                "Permintaan gagal. Periksa daftar AWB sebelum mengulang.",
            });
          } finally {
            setBusy(false);
          }
        }}
      >
        <Button asChild variant="template" className="min-h-11">
          <a href="/transactions/template" download>
            Template Import
          </a>
        </Button>
        <div className="grid gap-1">
          <Label htmlFor="awb-import-file">Import Data</Label>
          <Input
            id="awb-import-file"
            name="file"
            type="file"
            accept=".xlsx,.xls"
            required
            className="min-h-11"
          />
        </div>
        <Button type="submit" className="min-h-11" disabled={busy}>
          {busy ? "Mengimpor…" : "Import"}
        </Button>
      </form>
      {result && (
        <output
          className={`mt-2 block text-sm ${result.ok ? "text-primary" : "text-destructive"}`}
        >
          {result.message}
        </output>
      )}
    </details>
  );
}
