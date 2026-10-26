import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, describe, expect, it } from "vitest";
import { seedFakeRecords } from "../../prisma/seed-data.mjs";
import { authSchemaOptions } from "../../src/lib/auth/schema-options";
import { PrismaClient } from "../../src/lib/db/generated/client";
import { testDatabaseUrl } from "../support/test-database-url";

const connectionString = testDatabaseUrl(
  process.env.TEST_DATABASE_URL,
  process.env.DATABASE_URL,
);
const client = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});
afterAll(() => client.$disconnect());
const rollback = new Error("SCH-01 verification rollback");

describe("SCH-01 schema on the isolated test database", () => {
  it("seeds 30 per named list with varied values and changes nothing on rerun", async () => {
    await expect(
      client.$transaction(
        async (tx) => {
          // Existing isolated-test fixtures are not owned by this seed.
          const protectedCounts = await Promise.all([
            tx.user.count(),
            tx.authAccount.count(),
            tx.customerAccounting.count(),
            tx.customerTaxProfile.count(),
          ]);
          await seedFakeRecords(tx);
          // Count only this seed's reserved IDs; preserve other test fixtures.
          const where = { id: { gte: 9100001, lte: 9100030 } };
          const snapshot = async () => ({
            vehicles: await tx.vehicle.findMany({
              where,
              orderBy: { id: "asc" },
            }),
            drivers: await tx.driver.findMany({
              where,
              orderBy: { id: "asc" },
            }),
            couriers: await tx.courier.findMany({
              where,
              orderBy: { id: "asc" },
            }),
            vendors: await tx.vendor.findMany({
              where,
              orderBy: { id: "asc" },
            }),
            customers: await tx.customer.findMany({
              where,
              orderBy: { id: "asc" },
            }),
            consignees: await tx.consignee.findMany({
              where,
              orderBy: { id: "asc" },
            }),
          });
          const before = await snapshot();
          for (const rows of Object.values(before)) {
            expect(rows).toHaveLength(30);
            expect(rows.every((row) => typeof row.id === "number")).toBe(true);
          }
          expect(new Set(before.vehicles.map((row) => row.status)).size).toBe(
            2,
          );
          expect(before.customers.some((row) => row.branchId === null)).toBe(
            true,
          );
          expect(before.customers.some((row) => row.regencyId !== null)).toBe(
            true,
          );
          expect(
            before.customers.some((row) => (row.address?.length ?? 0) > 300),
          ).toBe(true);
          expect(before.customers.some((row) => row.deletedAt !== null)).toBe(
            true,
          );
          await seedFakeRecords(tx);
          expect(await snapshot()).toEqual(before);
          expect(
            await Promise.all([
              tx.user.count(),
              tx.authAccount.count(),
              tx.customerAccounting.count(),
              tx.customerTaxProfile.count(),
            ]),
          ).toEqual(protectedCounts);
          throw rollback;
        },
        { timeout: 60000 },
      ),
    ).rejects.toBe(rollback);
  }, 65000);

  it("rolls back earlier seed inserts on a late occupied-ID collision", async () => {
    const before = await client.vendor.count();
    await expect(
      client.$transaction(
        async (tx) => {
          await tx.customer.create({
            data: { id: 9100030, name: "FAKE COLLISION" },
          });
          await seedFakeRecords(tx);
        },
        { timeout: 30000 },
      ),
    ).rejects.toThrow("Fake seed ID collision");
    expect(await client.vendor.count()).toBe(before);
    expect(
      await client.customer.findUnique({ where: { id: 9100030 } }),
    ).toBeNull();
  }, 35000);

  it("enforces new master references without leaving a partial record", async () => {
    await expect(
      client.customer.create({
        data: {
          id: 9200001,
          name: "FAKE INVALID RELATION",
          regencyId: 2147483646,
        },
      }),
    ).rejects.toMatchObject({ code: "P2003" });
    expect(
      await client.customer.findUnique({ where: { id: 9200001 } }),
    ).toBeNull();
  });

  it("retains child uniqueness after soft deletion", async () => {
    await expect(
      client.$transaction(async (tx) => {
        await tx.customer.create({
          data: { id: 9200002, name: "FAKE UNIQUENESS CHECK" },
        });
        await tx.customerTaxProfile.create({
          data: { id: 9200002, customerId: 9200002, deletedAt: new Date() },
        });
        await tx.customerTaxProfile.create({
          data: { id: 9200003, customerId: 9200002 },
        });
      }),
    ).rejects.toMatchObject({ code: "P2002" });
    expect(
      await client.customer.findUnique({ where: { id: 9200002 } }),
    ).toBeNull();
  });

  it("uses Better Auth numeric IDs and its separate account storage", async () => {
    await expect(
      client.$transaction(async (tx) => {
        const options = authSchemaOptions(tx as unknown as PrismaClient);
        const adapter = options.database(options);
        const now = new Date();
        const user = await adapter.create<{ id: string }>({
          model: "user",
          data: {
            name: "FAKE ADAPTER CHECK",
            email: "adapter-check@example.invalid",
            emailVerified: false,
            createdAt: now,
            updatedAt: now,
          },
        });
        expect(user.id).toMatch(/^\d+$/);
        await adapter.create({
          model: "account",
          data: {
            userId: user.id,
            accountId: "INVALID-PROVIDER-ID",
            providerId: "FAKE-PROVIDER",
            createdAt: now,
            updatedAt: now,
          },
        });
        expect(await tx.authAccount.count()).toBe(1);
        expect(await tx.account.count()).toBe(0);
        throw rollback;
      }),
    ).rejects.toBe(rollback);
  });
});
