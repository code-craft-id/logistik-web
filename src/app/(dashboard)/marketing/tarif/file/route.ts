import { excelResponse } from "@/features/finance/server/excel-response";
import { IdentityError } from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";
import {
  tariffPricing,
  tariffWorkbook,
} from "@/features/sales/server/customer-tariffs";

/** Template Import Tarif (customer: update) or Export Tarif (?data=1). */
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const pricing = tariffPricing(query.get("pricing"));
  const data = query.get("data") === "1";
  return excelResponse(
    `${data ? "Export" : "Template_Import"}_Tarif_${pricing}.xlsx`,
    async () => {
      const current = await currentIdentity();
      if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
      const customerId = Number(query.get("customerId")) || undefined;
      return tariffWorkbook(current.actor, pricing, data, customerId);
    },
  );
}
