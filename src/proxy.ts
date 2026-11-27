import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isPublicPath } from "@/lib/routes";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Optimistic cookie check only (no DB): every page, action and route handler
  // re-validates the session and rights itself, so a DB lookup here was paid twice.
  if (!getSessionCookie(request)) {
    if (pathname.split("/").includes("api")) {
      return NextResponse.json(
        { message: "Silakan masuk kembali." },
        { status: 401, headers: { "Cache-Control": "private, no-store" } },
      );
    }
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Data entry points authorize independently; identity is not put in response headers.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Public auth boundaries are checked by isPublicPath, not loose prefixes.
     * Do not bypass protection just because a dynamic path ends in an image suffix.
     */
    "/((?!_next/static/|_next/image$|favicon\\.ico$).*)",
  ],
};
