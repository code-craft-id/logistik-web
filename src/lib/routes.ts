export const DASHBOARD_PATH = "/dashboard";

/** Preserve the source inventory while adapting its old home URL to the app. */
export function applicationPreviewPath(sourcePath: string): string {
  return sourcePath === "/" ? DASHBOARD_PATH : sourcePath;
}

/** Path boundaries matter: /login-extra and /api/auth-extra are not public. */
export function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/api/auth" ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/_next/") ||
    ["/favicon.ico", "/robots.txt", "/sitemap.xml"].includes(pathname)
  );
}
