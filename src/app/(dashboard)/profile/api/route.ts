import { getProfile, updateProfile } from "@/app/(dashboard)/profile/actions";
import {
  assertSameOrigin,
  identityResponse,
} from "@/features/identity/server/http";

export async function GET() {
  return identityResponse(() => getProfile());
}
export async function PATCH(request: Request) {
  return identityResponse(async () => {
    assertSameOrigin(request);
    return updateProfile(await request.json());
  });
}
