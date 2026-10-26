import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { describe, expect, it, vi } from "vitest";
import { provisionLocalAdmin } from "../../scripts/create-admin.mjs";
import { authSchemaOptions } from "../../src/lib/auth/schema-options";
import type { PrismaClient } from "../../src/lib/db/generated/client";
import { loginSchema } from "../../src/lib/validation/auth";

// Real provider hashing is CPU-bound; these assertions do not define a login latency SLA.
describe("username login", () => {
  it("accepts username credentials instead of requiring an email", () => {
    expect(
      loginSchema.parse({ username: "admin", password: "password" }),
    ).toEqual({
      username: "admin",
      password: "password",
    });
    expect(
      loginSchema.safeParse({
        email: "admin@example.invalid",
        password: "password",
      }).success,
    ).toBe(false);
  });

  it("uses the installed provider to sign in, deny a wrong password and validate the cookie", async () => {
    const auth = betterAuth({
      ...authSchemaOptions({} as PrismaClient),
      database: memoryAdapter({
        user: [],
        authAccount: [],
        session: [],
        verification: [],
      }),
      baseURL: "http://localhost:3000",
      secret: "FAKE-TEST-ONLY-SECRET-AT-LEAST-32-CHARACTERS",
      emailAndPassword: { enabled: true },
      rateLimit: { enabled: false },
      logger: { disabled: true },
    });
    await auth.api.signUpEmail({
      body: {
        name: "FAKE Administrator",
        email: "fake@example.invalid",
        username: "admin",
        password: "password",
      },
    });
    const response = await auth.handler(
      new Request("http://localhost:3000/api/auth/sign-in/username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({ username: "ADMIN", password: "password" }),
      }),
    );
    expect(response.status).toBe(200);
    const cookies = response.headers
      .getSetCookie()
      .map((cookie) => cookie.split(";")[0])
      .join("; ");
    const session = await auth.api.getSession({
      headers: new Headers({ Cookie: cookies }),
    });
    expect(session?.user.username).toBe("admin");
    const denied = await auth.handler(
      new Request("http://localhost:3000/api/auth/sign-in/username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({ username: "admin", password: "wrong-password" }),
      }),
    );
    expect(denied.status).toBe(401);
    expect(denied.headers.get("set-cookie")).toBeNull();
  }, 30_000);
});

function database(existingPassword: string | null = null, occupied = false) {
  const tx = {
    user: {
      findUnique: vi
        .fn()
        .mockImplementation(({ where }) =>
          Promise.resolve(
            where.email
              ? { id: 42, username: null }
              : occupied
                ? { id: 99, username: "admin" }
                : null,
          ),
        ),
      update: vi.fn().mockResolvedValue({ id: 42, username: "admin" }),
      create: vi.fn().mockResolvedValue({ id: 43, username: "admin" }),
    },
    authAccount: {
      findMany: vi
        .fn()
        .mockResolvedValue(
          existingPassword ? [{ id: 10, password: existingPassword }] : [],
        ),
      create: vi.fn(),
      update: vi.fn(),
    },
    session: { deleteMany: vi.fn() },
  };
  return { tx, $transaction: vi.fn(async (callback) => callback(tx)) };
}

describe("explicit local admin bootstrap", () => {
  it("preserves the identity and relations and stores a provider-compatible hash", async () => {
    const db = database();
    expect(await provisionLocalAdmin(db, "password")).toEqual({
      id: 42,
      username: "admin",
    });
    expect(db.tx.user.create).not.toHaveBeenCalled();
    expect(db.tx.user.update).toHaveBeenCalledWith({
      where: { id: 42 },
      data: { username: "admin", displayUsername: "admin" },
    });
    const data = db.tx.authAccount.create.mock.calls[0][0].data;
    expect(data.accountId).toBe("42");
    expect(data.password).not.toBe("password");
    expect(
      await verifyPassword({ hash: data.password, password: "password" }),
    ).toBe(true);
    expect(db.tx.session.deleteMany).toHaveBeenCalledWith({
      where: { userId: 42 },
    });
  }, 30_000);

  it("does not reset credentials or sessions on a same-password rerun", async () => {
    const db = database(await hashPassword("password"));
    await provisionLocalAdmin(db, "password");
    expect(db.tx.authAccount.update).not.toHaveBeenCalled();
    expect(db.tx.authAccount.create).not.toHaveBeenCalled();
    expect(db.tx.session.deleteMany).not.toHaveBeenCalled();
  }, 30_000);

  it("refuses username collisions before any mutation", async () => {
    const db = database(null, true);
    await expect(provisionLocalAdmin(db, "password")).rejects.toThrow(
      "occupied",
    );
    expect(db.tx.user.update).not.toHaveBeenCalled();
    expect(db.tx.authAccount.create).not.toHaveBeenCalled();
  });

  it("creates a missing identity without assigning unapproved privileges", async () => {
    const db = database();
    db.tx.user.findUnique.mockResolvedValue(null);
    await provisionLocalAdmin(db, "password");
    expect(db.tx.user.create).toHaveBeenCalledWith({
      data: {
        name: "Administrator",
        email: "admin@logistik.local",
        username: "admin",
        displayUsername: "admin",
        emailVerified: true,
      },
    });
  });

  it("rejects invalid passwords before opening a transaction", async () => {
    const db = database();
    await expect(provisionLocalAdmin(db, "short")).rejects.toThrow("8 to 128");
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
