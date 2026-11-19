import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AccessActor } from "../../src/features/identity/permissions";
import { PrismaClient } from "../../src/lib/db/generated/client";
import { testDatabaseUrl } from "../support/test-database-url";

const url = testDatabaseUrl(
  process.env.TEST_DATABASE_URL,
  process.env.DATABASE_URL,
);
// The service uses the shared prisma singleton; point it at the guarded test DB.
process.env.DATABASE_URL = url;
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});
const tag = `TC${randomUUID().slice(0, 10)}`;
const ids = {
  company: 0,
  office: 0,
  branch: 0,
  other: 0,
  user: 0,
  customer: 0,
  foreign: 0,
  mode: 0,
  cost: 0,
  tx: [] as number[],
};
let service: typeof import("../../src/features/bookings/server/service");
const actor = (branchIds: number[]): AccessActor => ({
  id: ids.user,
  status: "ACTIVE",
  branchIds,
  group: {
    id: 1,
    name: "FAKE",
    status: "ACTIVE",
    deletedAt: null,
    permissions: [{ resource: "transaction", action: "create" }],
  },
});

beforeAll(async () => {
  service = await import("../../src/features/bookings/server/service");
  ids.company = (
    await db.company.create({
      data: { name: tag, isDepositAgent: false, showPriceOnPrint: false },
    })
  ).id;
  ids.office = (
    await db.office.create({
      data: { companyId: ids.company, name: tag, code: tag, status: "ACTIVE" },
    })
  ).id;
  ids.branch = (
    await db.branch.create({
      data: {
        officeId: ids.office,
        name: `${tag}A`,
        code: `${tag}A`,
        status: "ACTIVE",
      },
    })
  ).id;
  ids.other = (
    await db.branch.create({
      data: {
        officeId: ids.office,
        name: `${tag}B`,
        code: `${tag}B`,
        status: "ACTIVE",
      },
    })
  ).id;
  ids.user = (
    await db.user.create({
      data: {
        name: "FAKE capture user",
        email: `${randomUUID()}@example.invalid`,
        status: "ACTIVE",
      },
    })
  ).id;
  ids.customer = (
    await db.customer.create({
      data: { name: `${tag} customer`, branchId: ids.branch },
    })
  ).id;
  ids.foreign = (
    await db.customer.create({
      data: { name: `${tag} foreign`, branchId: ids.other },
    })
  ).id;
  ids.mode = (
    await db.transportMode.create({
      data: { name: `${tag} DARAT`, divider: "4000" },
    })
  ).id;
  ids.cost = (
    await db.costType.create({
      data: { name: `${tag} CASH`, status: "INACTIVE" },
    })
  ).id;
});

afterAll(async () => {
  await db.transactionStatusHistory.deleteMany({
    where: { transactionId: { in: ids.tx } },
  });
  await db.transaction.deleteMany({ where: { id: { in: ids.tx } } });
  await db.customer.deleteMany({
    where: { id: { in: [ids.customer, ids.foreign] } },
  });
  await db.transportMode.deleteMany({ where: { id: ids.mode } });
  await db.costType.deleteMany({ where: { id: ids.cost } });
  await db.user.deleteMany({ where: { id: ids.user } });
  await db.branch.deleteMany({
    where: { id: { in: [ids.branch, ids.other] } },
  });
  await db.office.deleteMany({ where: { id: ids.office } });
  await db.company.deleteMany({ where: { id: ids.company } });
  await db.$disconnect();
});

describe("Entry AWB capture fields", () => {
  it("stores customer, mode, description and remarks", async () => {
    const result = await service.createTransaction(
      {
        awbNo: `${tag}-1`,
        originBranchId: ids.branch,
        customerId: ids.customer,
        transportModeId: ids.mode,
        description: "Dokumen",
        remarks: "Fragile",
      },
      actor([ids.branch]),
    );
    ids.tx.push(result.transaction.id);
    expect(result.transaction).toMatchObject({
      customerId: ids.customer,
      transportModeId: ids.mode,
      description: "Dokumen",
      remarks: "Fragile",
    });
  });

  it("rejects out-of-scope customers and inactive masters", async () => {
    await expect(
      service.createTransaction(
        {
          awbNo: `${tag}-2`,
          originBranchId: ids.branch,
          customerId: ids.foreign,
        },
        actor([ids.branch]),
      ),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      service.createTransaction(
        { awbNo: `${tag}-3`, originBranchId: ids.branch, costTypeId: ids.cost },
        actor([ids.branch]),
      ),
    ).rejects.toThrow("VALIDATION_MASTER_NOT_FOUND");
  });

  it("numbers automatic AWBs per branch and month without duplicates", async () => {
    const date = new Date("2026-11-05T00:00:00.000Z");
    const made = await Promise.all(
      [1, 2, 3].map((n) =>
        service.createTransaction(
          {
            originBranchId: ids.branch,
            autoAwb: true,
            transactionDate: date,
            idempotencyKey: `${tag}-auto-${n}`,
          },
          actor([ids.branch]),
        ),
      ),
    );
    for (const m of made) ids.tx.push(m.transaction.id);
    const numbers = made.map((m) => m.transaction.awbNo ?? "").sort();
    const code = (
      await db.branch.findUniqueOrThrow({ where: { id: ids.branch } })
    ).code
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 10);
    expect(numbers).toEqual([
      `${code}261100001`,
      `${code}261100002`,
      `${code}261100003`,
    ]);
    // A retried request with the same key returns the same AWB.
    const again = await service.createTransaction(
      {
        originBranchId: ids.branch,
        autoAwb: true,
        transactionDate: date,
        idempotencyKey: `${tag}-auto-1`,
      },
      actor([ids.branch]),
    );
    expect(again.created).toBe(false);
  });

  it("prices Harga/Kg, Harga/Koli and Trucking on the server", async () => {
    const base = { originBranchId: ids.branch };
    const kg = await service.createTransaction(
      {
        ...base,
        awbNo: `${tag}-kg`,
        kilo: "3.5",
        volume: "4",
        pricingType: "KG",
        pricePerKg: "10000",
        minWeight: "5",
        otherFee: "1000",
        packingFee: "2000",
        pickupFee: "3000",
        discountPercent: "10",
        ppnPercent: "11",
        biaya: "1",
      },
      actor([ids.branch]),
    );
    const koli = await service.createTransaction(
      {
        ...base,
        awbNo: `${tag}-koli`,
        koli: 3,
        pricingType: "KOLI",
        pricePerKg: "25000",
      },
      actor([ids.branch]),
    );
    const manual = await service.createTransaction(
      { ...base, awbNo: `${tag}-manual`, kilo: "2", biaya: "75000" },
      actor([ids.branch]),
    );
    ids.tx.push(kg.transaction.id, koli.transaction.id, manual.transaction.id);
    // Terberat 4; billed max(4, 5) = 5 x 10000 + 6000 = 56000; -10% = 50400; +11% = 55944.
    expect(kg.transaction.chargeableWeight?.toString()).toBe("4");
    expect(kg.transaction.totalCost?.toString()).toBe("56000");
    expect(kg.transaction.biaya?.toString()).toBe("55944");
    expect(koli.transaction.biaya?.toString()).toBe("75000");
    expect(manual.transaction.biaya?.toString()).toBe("75000");
    expect(manual.transaction.totalCost).toBeNull();
  });
});
