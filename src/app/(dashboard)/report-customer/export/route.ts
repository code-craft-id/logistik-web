import { IdentityError } from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";
import {
  customerReport,
  customerReportWorkbook,
} from "@/features/reports/customer-report/server";

const headers = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};

/** Report Customer Excel (provider "Export Excel"). */
export async function GET(request: Request) {
  try {
    const current = await currentIdentity();
    if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
    const query = Object.fromEntries(new URL(request.url).searchParams);
    const report = await customerReport(current.actor, query);
    const bytes = customerReportWorkbook(report);
    const name = `Detail_Transaction_Customer_${report.input.from}_${report.input.to}.xlsx`;
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
      400: "Periksa periode (maksimal 31 hari, maksimal 20.000 AWB) dan filter.",
      401: "Silakan masuk kembali.",
      403: "Anda tidak memiliki akses ekspor atau cabang yang dipilih.",
      500: "Report Customer tidak dapat diunduh.",
    };
    return Response.json({ message: messages[status] }, { status, headers });
  }
}
