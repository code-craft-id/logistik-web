import type { NextRequest } from "next/server";
import {
  assertSameOrigin,
  identityResponse,
} from "@/features/identity/server/http";
import { createUserGroup, getUserGroups } from "../actions";
export async function GET(request: NextRequest) {
  return identityResponse(() =>
    getUserGroups(Object.fromEntries(request.nextUrl.searchParams)),
  );
}
export async function POST(request: NextRequest) {
  return identityResponse(async () => {
    assertSameOrigin(request);
    return createUserGroup(await request.json());
  }, 201);
}
