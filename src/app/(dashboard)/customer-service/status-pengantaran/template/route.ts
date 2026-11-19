import { permits } from "@/features/identity/permissions";
import { currentIdentity } from "@/features/identity/server/context";
import { statusTemplate } from "@/features/shipments/server/status-import";

/** Template Import (provider columns: AWB No., Date, Received, Status, Remarks). */
export async function GET() {
  const current = await currentIdentity();
  if (!current || !permits(current.actor, "update", "transaction"))
    return Response.json(
      { message: "Butuh hak Transaksi: ubah." },
      { status: current ? 403 : 401 },
    );
  return new Response(new Uint8Array(statusTemplate()), {
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="Template_Import_Status.xlsx"',
    },
  });
}
