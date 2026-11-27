import { excelResponse } from "@/features/finance/server/excel-response";
import { IdentityError } from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";
import { vehicleTemplate } from "@/features/imports/server/vehicles";

export async function GET() {
  return excelResponse("Template_Import_Kendaraan.xlsx", async () => {
    const current = await currentIdentity();
    if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
    return vehicleTemplate(current.actor);
  });
}
