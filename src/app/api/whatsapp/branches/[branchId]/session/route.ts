import {
  assertSameOrigin,
  identityResponse,
} from "@/features/identity/server/http";
import { whatsappConnectionService } from "@/features/whatsapp/server/context";

type Context = { params: Promise<{ branchId: string }> };
export async function GET(_request: Request, context: Context) {
  return identityResponse(async () =>
    whatsappConnectionService.status((await context.params).branchId),
  );
}
export async function POST(request: Request, context: Context) {
  return identityResponse(async () => {
    assertSameOrigin(request);
    return whatsappConnectionService.change(
      (await context.params).branchId,
      "POST",
    );
  });
}
export async function DELETE(request: Request, context: Context) {
  return identityResponse(async () => {
    assertSameOrigin(request);
    return whatsappConnectionService.change(
      (await context.params).branchId,
      "DELETE",
    );
  });
}
