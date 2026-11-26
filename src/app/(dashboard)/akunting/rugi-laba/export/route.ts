import {
  profitLoss,
  profitLossWorkbook,
} from "@/features/finance/server/profit-loss";
import { IdentityError } from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";

const headers = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};
const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
const messages: Record<number, string> = {
  400: "Periksa bulan, tahun dan cost centre.",
  401: "Silakan masuk kembali.",
  403: "Anda tidak memiliki akses laporan keuangan atau cabang ini.",
  500: "Rugi Laba tidak dapat diunduh.",
};

/** Hitung Rugi Laba Export Excel: same rights, scope and filters as the page. */
export async function GET(request: Request) {
  try {
    const current = await currentIdentity();
    if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
    const q = new URL(request.url).searchParams;
    const month = Number(q.get("month"));
    const year = Number(q.get("year"));
    const report = await profitLoss(current.actor, {
      month,
      year,
      branchId: q.get("branchId") ?? "",
    });
    const label = `${MONTHS[month - 1]}'${String(year).slice(2)}`;
    return new Response(
      new Uint8Array(profitLossWorkbook(report, label, year)),
      {
        headers: {
          ...headers,
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="Rugi_Laba_${year}-${String(month).padStart(2, "0")}.xlsx"`,
        },
      },
    );
  } catch (error) {
    const status =
      error instanceof IdentityError && [400, 401, 403].includes(error.status)
        ? error.status
        : 500;
    return Response.json({ message: messages[status] }, { status, headers });
  }
}
