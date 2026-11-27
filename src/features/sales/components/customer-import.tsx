"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { importCustomersAction } from "../customer-import-actions";

/** Provider buttons: Export Customers, Template Import, Import Customer. */
export function CustomerImport({
  canImport,
  lastId,
}: {
  canImport: boolean;
  lastId: number;
}) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string }>();
  return (
    <div className="space-y-3 rounded-lg border bg-background p-4">
      <p className="text-sm">
        Unique terakhir: <strong>{lastId}</strong>
      </p>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" className="min-h-11">
          <a href="/marketing/customer-file?data=1" download>
            Export Customers
          </a>
        </Button>
        {canImport && (
          <Button asChild variant="outline" className="min-h-11">
            <a href="/marketing/customer-file" download>
              Template Import Customer
            </a>
          </Button>
        )}
      </div>
      {canImport && (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            setBusy(true);
            setResult(undefined);
            try {
              const response = await importCustomersAction(new FormData(form));
              setResult(response);
              if (response.ok) form.reset();
            } catch {
              setResult({
                ok: false,
                message:
                  "Permintaan gagal. Periksa daftar customer sebelum mengulang.",
              });
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="grid gap-1">
            <Label htmlFor="customer-file">File customer</Label>
            <Input
              id="customer-file"
              name="file"
              type="file"
              accept=".xlsx,.xls"
              required
              className="min-h-11"
            />
          </div>
          <Button type="submit" className="min-h-11" disabled={busy}>
            {busy ? "Mengimpor…" : "Import Customer"}
          </Button>
          {result && (
            <output
              className={`basis-full text-sm ${result.ok ? "text-primary" : "text-destructive"}`}
            >
              {result.message}
            </output>
          )}
        </form>
      )}
    </div>
  );
}
