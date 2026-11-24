import { expect, it } from "vitest";
import {
  bootstrapAdmin,
  validateAdminInput,
} from "../../scripts/bootstrap-production-admin.mjs";

const input = {
  username: "admin",
  email: "admin@example.invalid",
  name: "Administrator",
  password: "a-long-test-pass",
};

function fakeDb(users: number) {
  const calls: string[] = [];
  const tx = {
    $queryRaw: async () => [],
    user: {
      count: async () => users,
      create: async ({ data }: { data: { username: string } }) => {
        calls.push(`user:${data.username}`);
        return { id: 7, username: data.username };
      },
    },
    userGroup: {
      create: async ({
        data,
      }: {
        data: { permissions: { create: { resource: string } } };
      }) => {
        calls.push(`group:${data.permissions.create.resource}`);
        return { id: 3 };
      },
    },
    authAccount: {
      create: async ({ data }: { data: { password: string } }) => {
        calls.push(`credential:${data.password}`);
      },
    },
    identityAuditEvent: { create: async () => calls.push("audit") },
  };
  return {
    calls,
    prisma: { $transaction: (work: (t: typeof tx) => unknown) => work(tx) },
  };
}

it("validates the admin input", () => {
  expect(() =>
    validateAdminInput({ ADMIN_USERNAME: "Admin!", ADMIN_EMAIL: "x@y.z" }),
  ).toThrow("ADMIN_USERNAME");
  expect(() =>
    validateAdminInput({
      ADMIN_USERNAME: "admin",
      ADMIN_EMAIL: "x@y.z",
      ADMIN_PASSWORD: "short",
    }),
  ).toThrow("ADMIN_PASSWORD");
});

it("refuses a database that already has users", async () => {
  const { prisma, calls } = fakeDb(1);
  await expect(bootstrapAdmin(prisma, input, async () => "h")).rejects.toThrow(
    "REFUSED_NOT_EMPTY",
  );
  expect(calls).toEqual([]);
});

it("creates the full-access group, user, hashed credential and audit", async () => {
  const { prisma, calls } = fakeDb(0);
  await expect(
    bootstrapAdmin(prisma, input, async (p: string) => `hash(${p.length})`),
  ).resolves.toEqual({ id: 7, username: "admin" });
  expect(calls).toEqual([
    "group:system_admin",
    "user:admin",
    "credential:hash(16)",
    "audit",
  ]);
});
