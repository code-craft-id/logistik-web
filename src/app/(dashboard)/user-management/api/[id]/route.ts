import type { NextRequest } from "next/server";
import {
  assertSameOrigin,
  identityResponse,
} from "@/features/identity/server/http";
import { deleteUser, getUserById, updateUser } from "../../actions";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: NextRequest, context: Context) {
  return identityResponse(async () => getUserById((await context.params).id));
}
export async function PATCH(request: NextRequest, context: Context) {
  return identityResponse(async () => {
    assertSameOrigin(request);
    return updateUser((await context.params).id, await request.json());
  });
}
export async function DELETE(request: NextRequest, context: Context) {
  return identityResponse(async () => {
    assertSameOrigin(request);
    return deleteUser((await context.params).id);
  });
}
