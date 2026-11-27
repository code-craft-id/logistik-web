import { awbTemplate } from "@/features/bookings/server/awb-import";
import { excelResponse } from "@/features/finance/server/excel-response";
import { IdentityError } from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";

/** AWB Template Import (transaction: create). */
export async function GET() {
  return excelResponse("Template_Import_AWB.xlsx", async () => {
    const current = await currentIdentity();
    if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
    return awbTemplate(current.actor);
  });
}
