import { changePassword } from "@/app/(dashboard)/profile/actions";
import {
  assertSameOrigin,
  identityResponse,
} from "@/features/identity/server/http";

export async function POST(request: Request) {
  return identityResponse(async () => {
    assertSameOrigin(request);
    return changePassword(await request.json());
  });
}
