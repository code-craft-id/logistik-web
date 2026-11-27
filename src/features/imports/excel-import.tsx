"use client";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  importConsigneesAction,
  importVehiclesAction,
  importVendorTariffsAction,
} from "./actions";

const targets = {
  consignee: {
    template: "/marketing/consignee-file",
    action: importConsigneesAction,
    button: "Import Data",
  },
  vehicle: {
    template: "/logistics/vehicles/file",
    action: importVehiclesAction,
    button: "Import Vehicle",
  },
  vendorTariff: {
    template: "/vendor/tariff-file",
    action: importVendorTariffsAction,
    button: "Import Data",
  },
};

/** Provider "Template Import" and import buttons. */
export function ExcelImport({ target }: { target: keyof typeof targets }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string }>();
  const id = useId();
  const { template, action, button } = targets[target];
  return (
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
            message: "Permintaan gagal. Periksa daftar sebelum mengulang.",
          });
        } finally {
          setBusy(false);
        }
      }}
    >
      <Button asChild variant="outline" className="min-h-11">
        <a href={template} download>
          Template Import
        </a>
      </Button>
      <div className="grid gap-1">
        <Label htmlFor={id}>File Excel</Label>
        <Input
          id={id}
          name="file"
          type="file"
          accept=".xlsx,.xls"
          required
          className="min-h-11"
        />
      </div>
      <Button type="submit" className="min-h-11" disabled={busy}>
        {busy ? "Mengimpor…" : button}
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
