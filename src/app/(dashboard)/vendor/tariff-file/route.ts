import { excelResponse } from "@/features/finance/server/excel-response";
import { IdentityError } from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";
import {
  vendorTariffExport,
  vendorTariffTemplate,
} from "@/features/imports/server/vendor-tariffs";

/** Vendor price list: template, or the export of one vendor (?vendorId=). */
export async function GET(request: Request) {
  const vendorId = Number(new URL(request.url).searchParams.get("vendorId"));
  return excelResponse(
    vendorId ? "Tarif_Vendor.xlsx" : "Template_Import_Tarif_Vendor.xlsx",
    async () => {
      const current = await currentIdentity();
      if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
      return vendorId
        ? vendorTariffExport(current.actor, vendorId)
        : vendorTariffTemplate(current.actor);
    },
  );
}
