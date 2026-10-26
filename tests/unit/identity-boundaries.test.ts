import { readFileSync } from "node:fs";
// The installed Next 16 runtime still exports the middleware-named matcher.
import { unstable_doesMiddlewareMatch as unstable_doesProxyMatch } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { IdentityError } from "../../src/features/identity/server/access";
import { identityResponse } from "../../src/features/identity/server/http";
import { config, proxy } from "../../src/proxy";

const { sessionForHeaders } = vi.hoisted(() => ({
  sessionForHeaders: vi.fn(),
}));
vi.mock("../../src/features/identity/server/context", () => ({
  sessionForHeaders,
}));
beforeEach(() => {
  sessionForHeaders.mockReset().mockResolvedValue(null);
});

describe("PLT-01 server and request boundaries", () => {
  it("keeps token-bearing session helpers out of the public Server Action surface", () => {
    const source = readFileSync("src/lib/auth/session.ts", "utf8");
    expect(source).toMatch(/^import ["']server-only["'];/);
    expect(source).not.toMatch(/^[ \t]*["']use server["'];/m);
  });

  it.each([
    "/dashboard",
    "/user-management/api/1.png",
    "/group-user/api/1.svg",
    "/api/auth-extra",
    "/faviconXico",
  ])("does not bypass proxy for dynamic or lookalike path %s", (url) => {
    expect(unstable_doesProxyMatch({ config, url })).toBe(true);
  });

  it.each([
    "/_next/static/chunks/app.js",
    "/_next/image",
    "/favicon.ico",
  ])("excludes only framework assets %s", (url) => {
    expect(unstable_doesProxyMatch({ config, url })).toBe(false);
  });

  it.each([
    "/",
    "/login",
    "/api/auth/sign-in/username",
  ])("does not fetch sessions for public path %s", async (path) => {
    const response = await proxy(
      new NextRequest(`http://localhost:3000${path}`),
    );
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(sessionForHeaders).not.toHaveBeenCalled();
  });

  it("redirects an anonymous page request and denies an API request as uncached JSON", async () => {
    const page = await proxy(
      new NextRequest("http://localhost:3000/group-user"),
    );
    expect(page.status).toBe(307);
    expect(page.headers.get("location")).toBe("http://localhost:3000/login");
    const api = await proxy(
      new NextRequest("http://localhost:3000/user-management/api"),
    );
    expect(api.status).toBe(401);
    expect(api.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await api.json()).toEqual({ message: "Silakan masuk kembali." });
  });

  it("forwards the original headers for a live check without returning identity headers", async () => {
    sessionForHeaders.mockResolvedValueOnce({ actor: { id: 10 } });
    const request = new NextRequest("http://localhost:3000/user-management", {
      headers: { Cookie: "FAKE-session-only" },
    });
    const response = await proxy(request);
    expect(sessionForHeaders).toHaveBeenCalledExactlyOnceWith(request.headers);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect([...response.headers.values()].join(" ")).not.toContain(
      "FAKE-session",
    );
  });

  it.each([
    new IdentityError("UNAUTHENTICATED", 401),
    new IdentityError("FORBIDDEN", 403),
    new IdentityError("NOT_FOUND", 404),
    new SyntaxError("FAKE private payload"),
    Object.assign(new Error("FAKE private SQL"), { code: "P2002" }),
    Object.assign(new Error("FAKE private SQL"), { code: "P2025" }),
    Object.assign(new Error("FAKE private SQL"), { code: "P2003" }),
    Object.assign(new Error("FAKE private SQL"), { code: "P2034" }),
    Object.assign(new Error("FAKE private SQL"), { code: "P2010" }),
    new Error("FAKE internal error"),
    z.string().safeParse(1).error,
  ])("prevents caching every sanitized failure %#", async (error) => {
    const response = await identityResponse(async () => {
      throw error;
    });
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.text()).not.toContain("FAKE");
  });
});

describe("legacy seed command uses the canonical guarded entry point", () => {
  it("delegates without constructing a second client or embedding a connection string", () => {
    const source = readFileSync("scripts/seed-direct.mjs", "utf8");
    // Target/production rejection is exercised in local-database.test.ts.
    expect(source).toContain('import "../prisma/seed.mjs";');
    expect(source).not.toMatch(
      /postgres(?:ql)?:|PrismaClient|PrismaPg|\$transaction/,
    );
  });
});
