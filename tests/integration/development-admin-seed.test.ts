import { PrismaPg } from "@prisma/adapter-pg";
import { verifyPassword } from "better-auth/crypto";
import { afterAll, describe, expect, it } from "vitest";
import { seedDevelopmentAdministrators } from "../../prisma/seed-admins.mjs";
import { isAdministrator } from "../../src/features/identity/permissions";
import { loadAccessActor } from "../../src/features/identity/server/access";
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
const passwords = {
  DEV2_ADMIN_PASSWORD: "FAKE-dev2-seed-test-password",
  DEV3_ADMIN_PASSWORD: "FAKE-dev3-seed-test-password",
};
const rollback = new Error("Development admin seed verification rollback");
afterAll(() => db.$disconnect());

describe("local development administrator seed", () => {
  it("creates provider-compatible full administrators and preserves credentials, sessions and status on rerun", async () => {
    await expect(
      db.$transaction(
        async (tx) => {
          expect(await seedDevelopmentAdministrators(tx, passwords)).toEqual([
            { username: "dev2_admin", created: true },
            { username: "dev3_admin", created: true },
          ]);
          for (const [index, username] of [
            "dev2_admin",
            "dev3_admin",
          ].entries()) {
            const user = await tx.user.findUniqueOrThrow({
              where: { username },
            });
            expect(isAdministrator(await loadAccessActor(tx, user.id))).toBe(
              true,
            );
            expect(
              await tx.userAllowedBranch.count({ where: { userId: user.id } }),
            ).toBe(0);
            const credential = await tx.authAccount.findFirstOrThrow({
              where: { userId: user.id, providerId: "credential" },
            });
            expect(credential.accountId).toBe(String(user.id));
            expect(
              await verifyPassword({
                hash: credential.password ?? "",
                password:
                  index === 0
                    ? passwords.DEV2_ADMIN_PASSWORD
                    : passwords.DEV3_ADMIN_PASSWORD,
              }),
            ).toBe(true);
          }
          const user = await tx.user.findUniqueOrThrow({
            where: { username: "dev2_admin" },
          });
          await tx.session.create({
            data: {
              userId: user.id,
              token: "FAKE-development-admin-seed-session",
              expiresAt: new Date(Date.now() + 60_000),
            },
          });
          await tx.user.update({
            where: { id: user.id },
            data: { status: "INACTIVE" },
          });
          const before = await tx.authAccount.findMany({
            where: { userId: user.id },
          });
          expect(
            await seedDevelopmentAdministrators(tx, {
              DEV2_ADMIN_PASSWORD: "FAKE-different-dev2-password",
              DEV3_ADMIN_PASSWORD: "FAKE-different-dev3-password",
            }),
          ).toEqual([
            { username: "dev2_admin", created: false },
            { username: "dev3_admin", created: false },
          ]);
          expect(
            await tx.authAccount.findMany({ where: { userId: user.id } }),
          ).toEqual(before);
          expect(await tx.session.count({ where: { userId: user.id } })).toBe(
            1,
          );
          expect(
            (await tx.user.findUniqueOrThrow({ where: { id: user.id } }))
              .status,
          ).toBe("INACTIVE");
          throw rollback;
        },
        { timeout: 60_000 },
      ),
    ).rejects.toBe(rollback);
  }, 70_000);

  it("refuses identity collisions without granting privileges or creating the other account", async () => {
    await expect(
      db.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            name: "FAKE occupied identity",
            username: "dev3_admin",
            email: "occupied.dev3@example.invalid",
          },
        });
        await expect(
          seedDevelopmentAdministrators(tx, passwords),
        ).rejects.toThrow("collision");
        expect(await tx.user.count({ where: { username: "dev2_admin" } })).toBe(
          0,
        );
        expect(
          await tx.userGroup.count({
            where: { name: "DEVELOPMENT_ADMINISTRATOR" },
          }),
        ).toBe(0);
        throw rollback;
      }),
    ).rejects.toBe(rollback);
  });

  it("skips optional accounts and rejects partial or invalid password configuration before touching the database", async () => {
    expect(await seedDevelopmentAdministrators({}, {})).toEqual([]);
    await expect(
      seedDevelopmentAdministrators(
        {},
        { DEV2_ADMIN_PASSWORD: "FAKE-only-one-password" },
      ),
    ).rejects.toThrow("Both");
    await expect(
      seedDevelopmentAdministrators(
        {},
        { ...passwords, DEV3_ADMIN_PASSWORD: "short" },
      ),
    ).rejects.toThrow("Both");
  });
});
