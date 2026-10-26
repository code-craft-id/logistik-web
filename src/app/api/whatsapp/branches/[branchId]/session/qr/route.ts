import {
  assertSameOrigin,
  identityResponse,
} from "@/features/identity/server/http";
import { whatsappConnectionService } from "@/features/whatsapp/server/context";

export async function GET(
  request: Request,
  context: { params: Promise<{ branchId: string }> },
) {
  return identityResponse(async () => {
    // QR grants device access. Require an explicit same-origin application fetch.
    if (request.headers.get("sec-fetch-site") !== "same-origin")
      assertSameOrigin(request);
    return whatsappConnectionService.qr((await context.params).branchId);
  });
}
