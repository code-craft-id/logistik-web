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
// The queries use the shared prisma singleton; point it at the guarded test DB.
process.env.DATABASE_URL = url;
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});
const tag = `MQ${randomUUID().slice(0, 10)}`;
const ids = {
  company: 0,
  office: 0,
  branches: [] as number[],
  manifests: [] as number[],
  transactions: [] as number[],
};
let queries: typeof import("../../src/features/shipments/server/manifests-queries");
let sheets: typeof import("../../src/features/shipments/server/delivery-sheets");
const actor = (branchIds: number[], admin = false): AccessActor => ({
  id: 1,
  status: "ACTIVE",
  branchIds,
  group: {
    id: 1,
    name: "FAKE",
    status: "ACTIVE",
    deletedAt: null,
    permissions: admin
      ? [{ resource: "system_admin", action: "manage" }]
      : [{ resource: "manifest", action: "view" }],
  },
});

beforeAll(async () => {
  queries = await import(
    "../../src/features/shipments/server/manifests-queries"
  );
  sheets = await import("../../src/features/shipments/server/delivery-sheets");
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
  for (let i = 0; i < 2; i++)
    ids.branches.push(
      (
        await db.branch.create({
          data: {
            officeId: ids.office,
            name: `FAKE ${tag} ${i}`,
            code: `${tag}${i}`,
            status: "ACTIVE",
          },
        })
      ).id,
    );
  const [a, b] = ids.branches;
  for (const [suffix, branchId] of [
    ["A", a],
    ["B", b],
  ] as const)
    ids.manifests.push(
      (
        await db.manifest.create({
          data: {
            manifestNo: `${tag}-${suffix}`,
            branchId,
            originBranchId: a,
            destinationBranchId: b,
          },
        })
      ).id,
    );
  for (const [suffix, kilo] of [
    ["1", "1.50"],
    ["2", null],
    ["3", "2.00"],
  ] as const)
    ids.transactions.push(
      (
        await db.transaction.create({
          data: {
            awbNo: `${tag}-${suffix}`,
            originBranchId: a,
            destinationBranchId: b,
            koli: 2,
            kilo,
            volume: "0.100",
          },
        })
      ).id,
    );
  await db.manifestItem.createMany({
    data: [
      { manifestId: ids.manifests[0], transactionId: ids.transactions[0] },
      { manifestId: ids.manifests[0], transactionId: ids.transactions[1] },
      {
        manifestId: ids.manifests[0],
        transactionId: ids.transactions[2],
        releasedAt: new Date(),
      },
    ],
  });
});

afterAll(async () => {
  await db.deliverySheet.deleteMany({
    where: { manifestId: { in: ids.manifests } },
  });
  await db.manifestItem.deleteMany({
    where: { manifestId: { in: ids.manifests } },
  });
  await db.manifest.deleteMany({ where: { id: { in: ids.manifests } } });
  await db.transaction.deleteMany({ where: { id: { in: ids.transactions } } });
  await db.branch.deleteMany({ where: { id: { in: ids.branches } } });
  await db.office.deleteMany({ where: { id: ids.office } });
  await db.company.deleteMany({ where: { id: ids.company } });
  await db.$disconnect();
});

describe("manifest list/detail queries", () => {
  it("refuses an AWB number shared by two origin branches", async () => {
    const [a, b] = ids.branches;
    const twin = await db.transaction.create({
      data: { awbNo: `${tag}-1`, originBranchId: b, destinationBranchId: a },
    });
    ids.transactions.push(twin.id);
    try {
      expect(
        await queries.findAssignableTransaction(actor([a, b]), `${tag}-1`),
      ).toBe("AMBIGUOUS");
      expect(
        await queries.findAssignableTransaction(actor([a]), `${tag}-2`),
      ).toMatchObject({ id: ids.transactions[1] });
    } finally {
      await db.transaction.delete({ where: { id: twin.id } });
      ids.transactions.pop();
    }
  });

  it("scopes manifests to the actor's branches", async () => {
    const [a] = ids.branches;
    const scoped = await queries.listManifests(actor([a]), { search: tag });
    expect(scoped.items.map((m) => m.manifestNo)).toEqual([`${tag}-A`]);
    const admin = await queries.listManifests(actor([], true), { search: tag });
    expect(admin.total).toBe(2);
    expect((await queries.listManifests(actor([]))).total).toBe(0);
    expect(await queries.getManifest(actor([a]), ids.manifests[1])).toBeNull();
  });

  it("totals only active items and reports unknown weight as unavailable", async () => {
    const [a] = ids.branches;
    const detail = await queries.getManifest(actor([a]), ids.manifests[0]);
    expect(detail).toMatchObject({
      awb: 2,
      koli: 4,
      kilo: null,
      volume: "0.2",
      origin: `FAKE ${tag} 0`,
      destination: `FAKE ${tag} 1`,
    });
    expect(detail?.items.map((i) => i.awbNo)).toEqual([`${tag}-1`, `${tag}-2`]);
  });

  it("resolves only visible AWB numbers for assignment", async () => {
    const [a] = ids.branches;
    expect(
      await queries.findAssignableTransaction(
        actor([a]),
        `${tag}-3`.toLowerCase(),
      ),
    ).toMatchObject({ id: ids.transactions[2] });
    expect(
      await queries.findAssignableTransaction(
        actor([ids.branches[1] + 999]),
        `${tag}-3`,
      ),
    ).toBeNull();
  });

  it("creates one delivery sheet per visible manifest", async () => {
    const [a, b] = ids.branches;
    const writer = (branchIds: number[]): AccessActor => ({
      ...actor(branchIds),
      group: {
        id: 1,
        name: "FAKE",
        status: "ACTIVE",
        deletedAt: null,
        permissions: [{ resource: "delivery", action: "create" }],
      },
    });
    const input = {
      manifestId: ids.manifests[0],
      sheetNo: `${tag}-DRS`,
      deliveryDate: "2026-11-05",
    };
    await expect(
      sheets.createDeliverySheet(writer([b]), input),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      sheets.createDeliverySheet(actor([a]), input),
    ).rejects.toMatchObject({ status: 403 });
    const sheet = await sheets.createDeliverySheet(writer([a]), input);
    expect(sheet.manifestId).toBe(ids.manifests[0]);
    await expect(
      sheets.createDeliverySheet(writer([a]), {
        ...input,
        sheetNo: `${tag}-DRS2`,
      }),
    ).rejects.toMatchObject({ code: "P2002" });
    expect(
      (await queries.getManifest(actor([a]), ids.manifests[0]))?.deliverySheet,
    ).toMatchObject({
      sheetNo: `${tag}-DRS`,
      date: "2026-11-05",
    });
  });
});
