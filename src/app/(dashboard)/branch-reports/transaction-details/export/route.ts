import { IdentityError } from "@/features/identity/server/access";
import { transactionReportService } from "@/features/reports/transaction-details/server/context";

const headers = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const query: Record<string, string | string[]> = Object.create(null);
    for (const [key, value] of params) {
      query[key] = Object.hasOwn(query, key) ? params.getAll(key) : value;
    }
    const csv = await transactionReportService.export(query);
    return new Response(csv, {
      headers: {
        ...headers,
        "Content-Type": "text/csv;charset=utf-8",
        "Content-Disposition": 'attachment; filename="transaction-details.csv"',
      },
    });
  } catch (error) {
    const status =
      error instanceof IdentityError &&
      [400, 401, 403, 422].includes(error.status)
        ? error.status
        : 500;
    const messages: Record<number, string> = {
      400: "Pilih filter laporan yang valid sebelum mengunduh.",
      401: "Silakan masuk kembali.",
      403: "Anda tidak memiliki akses ekspor atau cabang yang dipilih.",
      422: "Hasil melebihi 5000 baris. Persempit filter laporan.",
      500: "Laporan tidak dapat diunduh.",
    };
    return Response.json({ message: messages[status] }, { status, headers });
  }
}
