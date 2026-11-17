import "server-only";
import { IdentityError } from "@/features/identity/server/access";
import type { AwbStatusKind } from "./contracts";
import { awbView } from "./filters";
import { awbStatusReportService } from "./server/context";

const headers = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};
const messages: Record<number, string> = {
  400: "Pilih filter laporan yang valid sebelum mengunduh.",
  401: "Silakan masuk kembali.",
  403: "Anda tidak memiliki akses ekspor atau cabang yang dipilih.",
  422: "Hasil melebihi 5000 baris. Persempit filter laporan.",
  500: "Laporan tidak dapat diunduh.",
};

/** Same view+export permission, scope and filters as the page; never a separate query contract. */
export async function awbStatusExport(
  request: Request,
  report: "awb" | "all-status",
) {
  try {
    const params = new URL(request.url).searchParams;
    const query: Record<string, string | string[]> = Object.create(null);
    for (const [key, value] of params)
      query[key] = Object.hasOwn(query, key) ? params.getAll(key) : value;
    const { view, ...rest } = query;
    const kind: AwbStatusKind | null =
      report === "all-status"
        ? view === undefined
          ? "all-status"
          : null
        : awbView(view);
    if (!kind) throw new IdentityError("INVALID_FILTER", 400);
    const csv = await awbStatusReportService.export(kind, rest);
    return new Response(csv, {
      headers: {
        ...headers,
        "Content-Type": "text/csv;charset=utf-8",
        "Content-Disposition": `attachment; filename="${kind === "all-status" ? "semua-status" : kind === "pending" ? "awb-tertunda" : "awb-termanifest"}.csv"`,
      },
    });
  } catch (error) {
    const status =
      error instanceof IdentityError &&
      [400, 401, 403, 422].includes(error.status)
        ? error.status
        : 500;
    return Response.json({ message: messages[status] }, { status, headers });
  }
}
