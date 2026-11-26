import { accountTemplate } from "@/features/finance/server/account-excel";
import { permits } from "@/features/identity/permissions";
import { currentIdentity } from "@/features/identity/server/context";

/** Perkiraan Template Import: header row and one example row. */
export async function GET() {
  const current = await currentIdentity();
  if (!current || !permits(current.actor, "manage", "finance_account"))
    return Response.json(
      { message: "Anda tidak memiliki hak kelola Perkiraan." },
      {
        status: current ? 403 : 401,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  return new Response(new Uint8Array(accountTemplate()), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="Template_Perkiraan.xlsx"',
    },
  });
}
