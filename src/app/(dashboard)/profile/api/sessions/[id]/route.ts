import { revokeSession } from "@/app/(dashboard)/profile/actions";
import {
  assertSameOrigin,
  identityResponse,
} from "@/features/identity/server/http";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return identityResponse(async () => {
    assertSameOrigin(request);
    return revokeSession((await params).id);
  });
}
