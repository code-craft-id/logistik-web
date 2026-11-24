import { IdentityError } from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";
import {
  profitReport,
  profitWorkbook,
} from "@/features/modul/server/profit-report";

const headers = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};

/** Laporan Keuntungan Excel (sandbox "Ekspor Excel"). */
export async function GET(request: Request) {
  try {
    const current = await currentIdentity();
    if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
    const query = Object.fromEntries(new URL(request.url).searchParams);
    const report = await profitReport(current.actor, query);
    const name = `Laporan_Laba_${report.year}-${String(report.month).padStart(2, "0")}.xlsx`;
    return new Response(new Uint8Array(profitWorkbook(report)), {
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
      400: "Pilih bulan dan tahun yang valid.",
      401: "Silakan masuk kembali.",
      403: "Anda tidak memiliki hak lihat Pembayaran Hutang.",
      500: "Laporan Keuntungan tidak dapat diunduh.",
    };
    return Response.json({ message: messages[status] }, { status, headers });
  }
}
