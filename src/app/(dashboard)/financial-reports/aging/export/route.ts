import { IdentityError } from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";
import {
  agingReport,
  agingWorkbook,
} from "@/features/reports/aging/server/aging";

const headers = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};

/** Rekap Aging Pelanggan Excel (provider Report AR "Ekspor Excel"). */
export async function GET(request: Request) {
  try {
    const current = await currentIdentity();
    if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
    const query = Object.fromEntries(new URL(request.url).searchParams);
    const report = await agingReport(current.actor, query);
    const { year, month } = report.input;
    return new Response(new Uint8Array(agingWorkbook(report)), {
      headers: {
        ...headers,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Rekap_Aging_Pelanggan_${year}-${String(month).padStart(2, "0")}.xlsx"`,
      },
    });
  } catch (error) {
    const status =
      error instanceof IdentityError && [400, 401, 403].includes(error.status)
        ? error.status
        : 500;
    const messages: Record<number, string> = {
      400: "Pilih bulan, tahun dan pelanggan yang valid.",
      401: "Silakan masuk kembali.",
      403: "Anda tidak memiliki akses invoice atau cabang.",
      500: "Laporan tidak dapat diunduh.",
    };
    return Response.json({ message: messages[status] }, { status, headers });
  }
}
