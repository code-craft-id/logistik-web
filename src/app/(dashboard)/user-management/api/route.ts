import type { NextRequest } from "next/server";
import {
  assertSameOrigin,
  identityResponse,
} from "@/features/identity/server/http";
import { createUser, getUsers } from "../actions";
export async function GET(request: NextRequest) {
  return identityResponse(() =>
    getUsers(Object.fromEntries(request.nextUrl.searchParams)),
  );
}
export async function POST(request: NextRequest) {
  return identityResponse(async () => {
    assertSameOrigin(request);
    return createUser(await request.json());
  }, 201);
}
