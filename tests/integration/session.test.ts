import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { betterAuth } from "better-auth";
import { hashPassword } from "better-auth/crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { authSchemaOptions } from "../../src/lib/auth/schema-options";
import { PrismaClient } from "../../src/lib/db/generated/client";
import { testDatabaseUrl } from "../support/test-database-url";

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: testDatabaseUrl(
      process.env.TEST_DATABASE_URL,
      process.env.DATABASE_URL,
    ),
  }),
});
const baseURL = "http://localhost:3000";
const username = `fake_${randomUUID().slice(0, 8)}`;
const password = "FAKE-session-test-password";
let userId: number | undefined;
const schemaOptions = authSchemaOptions(db);
const auth = betterAuth({
  ...schemaOptions,
  // Better Auth skips origin checks by default in NODE_ENV=test; exercise real protection.
  advanced: {
    ...schemaOptions.advanced,
    disableOriginCheck: false,
    disableCSRFCheck: false,
  },
  baseURL,
  secret: "FAKE-SESSION-TEST-ONLY-SECRET-AT-LEAST-32-CHARACTERS",
  emailAndPassword: { enabled: true, disableSignUp: true },
  session: { cookieCache: { enabled: false } },
  rateLimit: { enabled: false },
  logger: { disabled: true },
});

beforeAll(async () => {
  const user = await db.user.create({
    data: {
      name: "FAKE Session test",
      username,
      email: `${username}@example.invalid`,
    },
  });
  userId = user.id;
  await db.authAccount.create({
    data: {
      userId,
      accountId: String(userId),
      providerId: "credential",
      password: await hashPassword(password),
    },
  });
});
afterEach(async () => {
  if (userId !== undefined) await db.session.deleteMany({ where: { userId } });
});
afterAll(async () => {
  try {
    if (userId !== undefined) await db.user.delete({ where: { id: userId } });
  } finally {
    await db.$disconnect();
  }
});

async function signIn() {
  const response = await auth.handler(
    new Request(`${baseURL}/api/auth/sign-in/username`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: baseURL },
      body: JSON.stringify({ username, password }),
    }),
  );
  expect(response.status).toBe(200);
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(";")[0])
    .join("; ");
}
function signOut(cookie = "", origin = baseURL) {
  return auth.handler(
    new Request(`${baseURL}/api/auth/sign-out`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
        Origin: origin,
      },
      body: "{}",
    }),
  );
}
function session(cookie: string) {
  return auth.api.getSession({ headers: new Headers({ Cookie: cookie }) });
}

describe("PLT-01 provider logout with PostgreSQL sessions", () => {
  it("deletes the current persisted session, rejects replay, and preserves other device sessions", async () => {
    const current = await signIn();
    const other = await signIn();
    const prior = await session(current);
    expect(prior?.user.username).toBe(username);
    const response = await signOut(current);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(
      response.headers
        .getSetCookie()
        .some(
          (cookie) =>
            cookie.includes("session_token=;") && cookie.includes("Max-Age=0"),
        ),
    ).toBe(true);
    expect(
      await db.session.findUnique({
        where: { token: prior?.session.token ?? "" },
      }),
    ).toBeNull();
    expect(await session(current)).toBeNull();
    expect((await session(other))?.user.username).toBe(username);
    expect(await db.session.count({ where: { userId } })).toBe(1);
  });

  it("rejects cross-origin logout without deleting the current session", async () => {
    const cookie = await signIn();
    const response = await signOut(cookie, "https://external.invalid");
    expect(response.status).toBe(403);
    expect((await session(cookie))?.user.username).toBe(username);
    expect(await db.session.count({ where: { userId } })).toBe(1);
  });

  it("allows anonymous and repeated logout without deleting another session", async () => {
    const revoked = await signIn();
    expect((await signOut(revoked)).status).toBe(200);
    const active = await signIn();
    expect((await signOut(revoked)).status).toBe(200);
    expect((await signOut()).status).toBe(200);
    expect((await session(active))?.user.username).toBe(username);
    expect(await db.session.count({ where: { userId } })).toBe(1);
  });
});
