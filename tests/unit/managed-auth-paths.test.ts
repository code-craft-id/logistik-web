import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { describe, expect, it } from "vitest";
import { managedIdentityPaths } from "../../src/lib/auth/managed-paths";

const auth = betterAuth({
  database: memoryAdapter({
    user: [],
    account: [],
    session: [],
    verification: [],
  }),
  baseURL: "http://localhost:3000",
  secret: "FAKE-MANAGED-ROUTES-ONLY-SECRET-32-CHARACTERS",
  disabledPaths: managedIdentityPaths,
  emailAndPassword: { enabled: true },
  logger: { disabled: true },
  rateLimit: { enabled: false },
});
describe("PLT-01 audited mutation paths", () => {
  it.each(
    managedIdentityPaths,
  )("does not expose %s as an unaudited provider HTTP alternative", async (path) => {
    const response = await auth.handler(
      new Request(`http://localhost:3000/api/auth${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: "{}",
      }),
    );
    expect(response.status).toBe(404);
  });
  it("keeps provider sign-out available even for missing sessions", async () => {
    const response = await auth.handler(
      new Request("http://localhost:3000/api/auth/sign-out", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: "{}",
      }),
    );
    expect(response.status).toBe(200);
  });
});
