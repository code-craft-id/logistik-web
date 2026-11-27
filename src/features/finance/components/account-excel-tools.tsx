"use client";
import { Download, Upload } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  importAccountsAction,
  importAssetsAction,
  importCashPaymentsAction,
} from "../account-excel-actions";

const targets = {
  accounts: { path: "/akunting/data-akun", action: importAccountsAction },
  assets: { path: "/akunting/assets", action: importAssetsAction },
  cashOut: {
    path: "/akunting/kasir-pembayaran",
    action: importCashPaymentsAction,
  },
};

/** Export Excel, Template Import and Import Data (Perkiraan or Assets). */
export function AccountExcelTools({
  manage,
  target = "accounts",
  branches,
}: {
  manage: boolean;
  target?: keyof typeof targets;
  /** When the file has no branch column, the importer picks one. */
  branches?: { id: number; name: string }[];
}) {
  const { path, action } = targets[target];
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string }>();
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {target === "accounts" && (
          <Button asChild variant="outline" className="min-h-11">
            <a href={`${path}/export`} download>
              <Download aria-hidden="true" />
              Export Excel
            </a>
          </Button>
        )}
        {manage && (
          <Button asChild variant="outline" className="min-h-11">
            <a href={`${path}/template`} download>
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
              const response = await action(new FormData(form));
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
          {branches && (
            <div className="grid gap-1">
              <Label htmlFor="import-branch">Cabang</Label>
              <select
                id="import-branch"
                name="branchId"
                required
                defaultValue=""
                className="min-h-11 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Pilih cabang</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
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
