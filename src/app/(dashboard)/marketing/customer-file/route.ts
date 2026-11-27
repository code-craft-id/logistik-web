import { excelResponse } from "@/features/finance/server/excel-response";
import { IdentityError } from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";
import { customerWorkbook } from "@/features/sales/server/customer-import";

/** Template Import Customer (create) or Export Customers (?data=1, view). */
export async function GET(request: Request) {
  const data = new URL(request.url).searchParams.get("data") === "1";
  return excelResponse(
    data ? "Export_Customers.xlsx" : "Template_Import_Customer.xlsx",
    async () => {
      const current = await currentIdentity();
      if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
      return customerWorkbook(current.actor, data);
    },
  );
}
