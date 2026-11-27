"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { importCustomerTariffsAction } from "../tariff-actions";

export function TariffImport({
  pricing,
}: {
  pricing: "KG" | "KOLI" | "TRUCKING";
}) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string }>();
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        setBusy(true);
        setResult(undefined);
        try {
          const response = await importCustomerTariffsAction(
            new FormData(form),
          );
          setResult(response);
          if (response.ok) form.reset();
        } catch {
          setResult({
            ok: false,
            message:
              "Permintaan gagal. Periksa daftar tarif sebelum mengulang.",
          });
        } finally {
          setBusy(false);
        }
      }}
    >
      <input type="hidden" name="pricing" value={pricing} />
      <Button asChild variant="template" className="min-h-11">
        <a href={`/marketing/tarif/file?pricing=${pricing}`} download>
          Template Import Tarif
        </a>
      </Button>
      <div className="grid gap-1">
        <Label htmlFor="tariff-file">Select Import Tarif</Label>
        <Input
          id="tariff-file"
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
      {result && (
        <output
          className={`basis-full text-sm ${result.ok ? "text-primary" : "text-destructive"}`}
        >
          {result.message}
        </output>
      )}
    </form>
  );
}
