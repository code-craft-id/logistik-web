import { IdentityError } from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";
import {
  recapTransactions,
  recapWorkbook,
} from "@/features/reports/recap/server/recap";

const headers = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};

/** Rekap Transaksi Excel (provider "Ekspor Excel"). */
export async function GET(request: Request) {
  try {
    const current = await currentIdentity();
    if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
    const query = Object.fromEntries(new URL(request.url).searchParams);
    const recap = await recapTransactions(current.actor, query);
    const bytes = recapWorkbook(recap);
    const { year, month, sheet } = recap.input;
    const name = `Rekap_Transaksi_${year}-${String(month).padStart(2, "0")}_${sheet === "one" ? "one-sheet" : "multi-sheet"}.xlsx`;
    return new Response(new Uint8Array(bytes), {
      headers: {
        ...headers,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${name}"`,
      },
    });
  } catch (error) {
    const status =
      error instanceof IdentityError && [400, 401, 403].includes(error.status)
        ? error.status
        : 500;
    const messages: Record<number, string> = {
      400: "Pilih bulan, tahun dan cabang yang valid.",
      401: "Silakan masuk kembali.",
      403: "Anda tidak memiliki akses ekspor atau cabang yang dipilih.",
      500: "Rekap tidak dapat diunduh.",
    };
    return Response.json({ message: messages[status] }, { status, headers });
  }
}
