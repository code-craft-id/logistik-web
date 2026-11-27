import { excelResponse } from "@/features/finance/server/excel-response";
import { IdentityError } from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";
import { consigneeTemplate } from "@/features/imports/server/consignees";

export async function GET() {
  return excelResponse("Template_Import_Penerima.xlsx", async () => {
    const current = await currentIdentity();
    if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
    return consigneeTemplate(current.actor);
  });
}
