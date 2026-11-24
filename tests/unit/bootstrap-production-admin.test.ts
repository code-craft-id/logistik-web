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
  company: "PT CONTOH",
  branches: ["JAKARTA", "JAKARTA BARAT"],
};

function fakeDb(users: number) {
  const calls: string[] = [];
  const tx = {
    $queryRaw: async () => [],
    user: {
      count: async () => users,
      create: async ({
        data,
      }: {
        data: {
          username: string;
          allowedBranches: { create: unknown[] };
        };
      }) => {
        calls.push(
          `user:${data.username}:${data.allowedBranches.create.length}`,
        );
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
    company: { create: async () => ({ id: 1 }) },
    office: { create: async () => ({ id: 2 }) },
    branch: {
      create: async ({ data }: { data: { code: string } }) => {
        calls.push(`branch:${data.code}`);
        return { id: calls.length };
      },
    },
  };
  return {
    calls,
    prisma: { $transaction: (work: (t: typeof tx) => unknown) => work(tx) },
  };
}

it("validates the admin input", () => {
  expect(() =>
    validateAdminInput({
      ADMIN_USERNAME: "Admin!",
      ADMIN_EMAIL: "x@y.z",
      COMPANY_NAME: "PT",
      BRANCH_1: "A",
      BRANCH_2: "B",
    }),
  ).toThrow("ADMIN_USERNAME");
  expect(() =>
    validateAdminInput({ COMPANY_NAME: "PT", BRANCH_1: "A", BRANCH_2: "a" }),
  ).toThrow("BRANCH_1 dan BRANCH_2");
  expect(() =>
    validateAdminInput({
      ADMIN_USERNAME: "admin",
      ADMIN_EMAIL: "x@y.z",
      ADMIN_PASSWORD: "12345",
      COMPANY_NAME: "PT",
      BRANCH_1: "A",
      BRANCH_2: "B",
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

it("creates the company branches, full-access group, user, credential and audit", async () => {
  const { prisma, calls } = fakeDb(0);
  await expect(
    bootstrapAdmin(prisma, input, async (p: string) => `hash(${p.length})`),
  ).resolves.toEqual({ id: 7, username: "admin", branches: 2 });
  expect(calls).toEqual([
    // Same first three letters: the second branch code gets a suffix.
    "branch:JAK",
    "branch:JAK2",
    "group:system_admin",
    "user:admin:2",
    "credential:hash(16)",
    "audit",
  ]);
});
