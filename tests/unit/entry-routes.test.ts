import { existsSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import CompanyProfilePage from "../../src/app/page";
import {
  navigation,
  navigationPath,
} from "../../src/components/shell/navigation";
import {
  applicationPreviewPath,
  DASHBOARD_PATH,
  isPublicPath,
} from "../../src/lib/routes";

describe("public company profile and protected application entry", () => {
  it.each([
    "/",
    "/login",
    "/api/auth/sign-in/username",
    "/favicon.ico",
  ])("allows the public path %s", (path) =>
    expect(isPublicPath(path)).toBe(true));
  it.each([
    "/dashboard",
    "/group-user",
    "/office",
    "/login-extra",
    "/api/auth-extra",
    "/company",
  ])("does not accidentally open %s to anonymous visitors", (path) =>
    expect(isPublicPath(path)).toBe(false));
  it("keeps source route evidence but maps the legacy dashboard to /dashboard", () => {
    expect(applicationPreviewPath("/")).toBe(DASHBOARD_PATH);
    expect(applicationPreviewPath("/group-user")).toBe("/group-user");
    expect(navigation[0].href).toBe("/dashboard");
    expect(navigationPath("/dashboard")?.labels).toEqual(["Dashboard"]);
    expect(navigationPath("/")).toBeUndefined();
    expect(existsSync("src/app/(dashboard)/dashboard/page.tsx")).toBe(true);
    expect(existsSync("src/app/(dashboard)/page.tsx")).toBe(false);
  });
  it("renders an honest public profile without the internal dashboard or fabricated company data", () => {
    const html = renderToStaticMarkup(createElement(CompanyProfilePage));
    expect(html).toContain("Profil perusahaan");
    expect(html).toContain("Informasi perusahaan belum dipublikasikan");
    expect(html).toContain('href="/login"');
    expect(html).not.toContain('aria-label="Main navigation"');
    expect(html).not.toContain("Total Piutang");
    expect(html).not.toContain('href="/group-user"');
  });
});
