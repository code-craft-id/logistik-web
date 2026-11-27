import { IdentityError } from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";
import { shipmentStatusWorkbook } from "@/features/shipments/server/status-list";
import { businessDateString } from "@/lib/date/business-date";

const headers = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};
const messages: Record<number, string> = {
  401: "Silakan masuk kembali.",
  403: "Anda tidak memiliki akses Status Pengantaran.",
  422: "Hasil melebihi 5000 AWB. Persempit pencarian atau status.",
  500: "Status Pengantaran tidak dapat diunduh.",
};

/** Status Pengantaran Export Excel: same view right, scope and filters as the page. */
export async function GET(request: Request) {
  try {
    const current = await currentIdentity();
    if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
    const params = new URL(request.url).searchParams;
    const bytes = await shipmentStatusWorkbook(current.actor, {
      search: (params.get("q") ?? "").slice(0, 60),
      status: (params.get("status") ?? "").slice(0, 30),
    });
    return new Response(new Uint8Array(bytes), {
      headers: {
        ...headers,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Status_Pengantaran_${businessDateString(new Date())}.xlsx"`,
      },
    });
  } catch (error) {
    const status =
      error instanceof IdentityError && [401, 403, 422].includes(error.status)
        ? error.status
        : 500;
    return Response.json({ message: messages[status] }, { status, headers });
  }
}
