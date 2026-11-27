import { IdentityError } from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";
import {
  agentAwbs,
  agentReportWorkbook,
} from "@/features/organization/server/agent-reports";

const headers = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};

/** Rekap Transaksi Agen / Rekap Komisi Agen Excel. */
export async function GET(request: Request) {
  try {
    const current = await currentIdentity();
    if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
    const query = Object.fromEntries(new URL(request.url).searchParams);
    const kind = query.tab === "komisi" ? "komisi" : "transaksi";
    const report = await agentAwbs(current.actor, query);
    const name = `Rekap_${kind === "komisi" ? "Komisi" : "Transaksi"}_Agen.xlsx`;
    return new Response(new Uint8Array(agentReportWorkbook(kind, report)), {
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
      400: "Periksa periode dan filter.",
      401: "Silakan masuk kembali.",
      403: "Anda tidak memiliki hak lihat Transaksi.",
      500: "Laporan agen tidak dapat diunduh.",
    };
    return Response.json({ message: messages[status] }, { status, headers });
  }
}
