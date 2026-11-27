import { assetTemplate } from "@/features/finance/server/asset-import";
import { excelResponse } from "@/features/finance/server/excel-response";
import {
  assertPermission,
  IdentityError,
} from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";

/** Assets Template Import (finance_account: manage). */
export async function GET() {
  return excelResponse("Template_Assets.xlsx", async () => {
    const current = await currentIdentity();
    if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
    assertPermission(current.actor, "manage", "finance_account");
    return assetTemplate();
  });
}
