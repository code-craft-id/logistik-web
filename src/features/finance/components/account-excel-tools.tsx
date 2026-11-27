"use client";
import { Download, Upload } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { importAccountsAction } from "../account-excel-actions";

/** Perkiraan Export Excel, Template Import and Import Data buttons. */
export function AccountExcelTools({ manage }: { manage: boolean }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string }>();
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" className="min-h-11">
          <a href="/akunting/data-akun/export" download>
            <Download aria-hidden="true" />
            Export Excel
          </a>
        </Button>
        {manage && (
          <Button asChild variant="outline" className="min-h-11">
            <a href="/akunting/data-akun/template" download>
              <Download aria-hidden="true" />
              Template Import
            </a>
          </Button>
        )}
      </div>
      {manage && (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            setBusy(true);
            setResult(undefined);
            try {
              const response = await importAccountsAction(new FormData(form));
              setResult(response);
              if (response.ok) form.reset();
            } catch {
              setResult({
                ok: false,
                message: "Permintaan gagal. Periksa koneksi lalu coba lagi.",
              });
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="grid gap-1">
            <Label htmlFor="account-import-file">Import Data</Label>
            <Input
              id="account-import-file"
              name="file"
              type="file"
              accept=".xlsx,.xls"
              required
              className="min-h-11"
            />
          </div>
          <Button type="submit" className="min-h-11" disabled={busy}>
            <Upload aria-hidden="true" />
            {busy ? "Mengimpor…" : "Import"}
          </Button>
        </form>
      )}
      {result && (
        <output
          className={`text-sm ${result.ok ? "text-primary" : "text-destructive"}`}
        >
          {result.message}
        </output>
      )}
    </div>
  );
}
