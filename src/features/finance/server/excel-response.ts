import "server-only";
import { IdentityError } from "@/features/identity/server/access";

const headers = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};

export async function excelResponse(
  fileName: string,
  work: () => Promise<Buffer>,
) {
  try {
    return new Response(new Uint8Array(await work()), {
      headers: {
        ...headers,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    // IdentityError texts are safe for users; anything else stays generic.
    const known = error instanceof IdentityError ? error : null;
    return Response.json(
      { message: known?.message ?? "File tidak dapat diunduh." },
      { status: known?.status ?? 500, headers },
    );
  }
}
