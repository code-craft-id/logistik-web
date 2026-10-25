import {
  getUserSessions,
  revokeAllOtherSessions,
  revokeAllSessions,
} from "@/app/(dashboard)/profile/actions";
import { sessionRevokeSchema } from "@/features/identity/profile-validation";
import {
  assertSameOrigin,
  identityResponse,
} from "@/features/identity/server/http";

export async function GET(request: Request) {
  return identityResponse(() =>
    getUserSessions(Object.fromEntries(new URL(request.url).searchParams)),
  );
}
export async function POST(request: Request) {
  return identityResponse(async () => {
    assertSameOrigin(request);
    const { scope } = sessionRevokeSchema.parse(await request.json());
    return scope === "others" ? revokeAllOtherSessions() : revokeAllSessions();
  });
}
