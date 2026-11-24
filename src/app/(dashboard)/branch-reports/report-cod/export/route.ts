import { IdentityError } from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";
import { codReport, codReportWorkbook } from "@/features/modul/server/cod";

const headers = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};

/** Report COD Excel (sandbox "Ekspor"). */
export async function GET(request: Request) {
  try {
    const current = await currentIdentity();
    if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
    const query = Object.fromEntries(new URL(request.url).searchParams);
    const report = await codReport(current.actor, query);
    const name = `Report_COD_${report.year}-${String(report.month).padStart(2, "0")}.xlsx`;
    return new Response(new Uint8Array(codReportWorkbook(report)), {
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
      403: "Anda tidak memiliki hak lihat Pembayaran.",
      500: "Report COD tidak dapat diunduh.",
    };
    return Response.json({ message: messages[status] }, { status, headers });
  }
}
