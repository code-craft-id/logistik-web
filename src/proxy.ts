import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { sessionForHeaders } from "@/features/identity/server/context";
import { isPublicPath } from "@/lib/routes";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Check session
  const current = await sessionForHeaders(request.headers);

  if (!current) {
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
