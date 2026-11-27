import { Button } from "@/components/ui/button";
import { permits } from "@/features/identity/permissions";
import { currentIdentity } from "@/features/identity/server/context";
import { ExcelImport } from "./excel-import";
import { vendorTariffOptions } from "./server/vendor-tariffs";

const box = "space-y-3 rounded-lg border bg-background p-4";

export async function VehicleImportPanel() {
  const current = await currentIdentity();
  if (!current || !permits(current.actor, "create", "vehicle")) return null;
  return (
    <div className={box}>
      <h2 className="font-semibold">Import Kendaraan</h2>
      <ExcelImport target="vehicle" />
    </div>
  );
}

export async function VendorTariffPanel() {
  const current = await currentIdentity();
  if (!current || !permits(current.actor, "view", "vendor")) return null;
  const { vendors, lastUniqueNo } = await vendorTariffOptions(current.actor);
  return (
    <div className={box}>
      <h2 className="font-semibold">Tarif Vendor</h2>
      <p className="text-sm">
        Nomor terakhir (kolom Unique): <strong>{lastUniqueNo}</strong>
      </p>
      <form
        action="/vendor/tariff-file"
        className="flex flex-wrap items-end gap-2"
      >
        <label className="grid gap-1 text-sm font-medium">
          Export Tarif vendor
          <select
            name="vendorId"
            required
            className="min-h-11 rounded-md border bg-background px-3"
          >
            <option value="">Pilih vendor</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" variant="export" className="min-h-11">
          Export
        </Button>
      </form>
      {permits(current.actor, "update", "vendor") && (
        <ExcelImport target="vendorTariff" />
      )}
    </div>
  );
}
