import { accountsWorkbook } from "@/features/finance/server/account-excel";
import { IdentityError } from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";

const headers = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};

/** Perkiraan Export Excel (finance_account: view). */
export async function GET() {
  try {
    const current = await currentIdentity();
    if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
    return new Response(new Uint8Array(await accountsWorkbook(current.actor)), {
      headers: {
        ...headers,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="Perkiraan.xlsx"',
      },
    });
  } catch (error) {
    const status =
      error instanceof IdentityError && [401, 403].includes(error.status)
        ? error.status
        : 500;
    return Response.json(
      {
        message:
          status === 401
            ? "Silakan masuk kembali."
            : status === 403
              ? "Anda tidak memiliki akses Perkiraan."
              : "Perkiraan tidak dapat diunduh.",
      },
      { status, headers },
    );
  }
}
