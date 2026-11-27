import {
  cashTemplate,
  masterAccounts,
} from "@/features/finance/server/cash-import";
import { excelResponse } from "@/features/finance/server/excel-response";
import {
  assertPermission,
  IdentityError,
} from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";

/** Kasir Pembayaran Template Import (journal: create). */
export async function GET() {
  return excelResponse("Template_Kasir_Pembayaran.xlsx", async () => {
    const current = await currentIdentity();
    if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
    assertPermission(current.actor, "create", "journal");
    return cashTemplate(await masterAccounts());
  });
}
