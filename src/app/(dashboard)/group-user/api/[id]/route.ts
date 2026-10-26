import type { NextRequest } from "next/server";
import {
  assertSameOrigin,
  identityResponse,
} from "@/features/identity/server/http";
import {
  deleteUserGroup,
  getUserGroupById,
  updateUserGroup,
} from "../../actions";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: NextRequest, context: Context) {
  return identityResponse(async () =>
    getUserGroupById((await context.params).id),
  );
}
export async function PATCH(request: NextRequest, context: Context) {
  return identityResponse(async () => {
    assertSameOrigin(request);
    return updateUserGroup((await context.params).id, await request.json());
  });
}
export async function DELETE(request: NextRequest, context: Context) {
  return identityResponse(async () => {
    assertSameOrigin(request);
    return deleteUserGroup((await context.params).id);
  });
}
