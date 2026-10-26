import type { NextRequest } from "next/server";
import {
  assertSameOrigin,
  identityResponse,
} from "@/features/identity/server/http";
import { getPermissionMatrix, updatePermissionMatrix } from "../actions";
export async function GET(request: NextRequest) {
  return identityResponse(() =>
    getPermissionMatrix(Object.fromEntries(request.nextUrl.searchParams)),
  );
}
export async function PATCH(request: NextRequest) {
  return identityResponse(async () => {
    assertSameOrigin(request);
    return updatePermissionMatrix(await request.json());
  });
}
