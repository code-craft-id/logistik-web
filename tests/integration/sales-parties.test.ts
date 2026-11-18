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
const tag = `SP${randomUUID().slice(0, 10)}`;
const ids = { company: 0, office: 0, a: 0, b: 0, customers: [] as number[] };
let parties: typeof import("../../src/features/sales/server/parties");
const grants = ["view", "create", "update", "delete"];
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
      : grants.flatMap((action) =>
          ["customer", "consignee"].map((resource) => ({ resource, action })),
        ),
  },
});

beforeAll(async () => {
  parties = await import("../../src/features/sales/server/parties");
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
  ids.a = (
    await db.branch.create({
      data: {
        officeId: ids.office,
        name: `${tag}A`,
        code: `${tag}A`,
        status: "ACTIVE",
      },
    })
  ).id;
  ids.b = (
    await db.branch.create({
      data: {
        officeId: ids.office,
        name: `${tag}B`,
        code: `${tag}B`,
        status: "ACTIVE",
      },
    })
  ).id;
});

afterAll(async () => {
  await db.consignee.deleteMany({ where: { name: { startsWith: tag } } });
  await db.customer.deleteMany({ where: { name: { startsWith: tag } } });
  await db.branch.deleteMany({ where: { id: { in: [ids.a, ids.b] } } });
  await db.office.deleteMany({ where: { id: ids.office } });
  await db.company.deleteMany({ where: { id: ids.company } });
  await db.$disconnect();
});

describe("customer and consignee maintenance", () => {
  it("creates, lists, updates and soft-deletes within the actor's branch", async () => {
    const me = actor([ids.a]);
    const created = await parties.saveParty(me, "customer", {
      name: `${tag} Customer`,
      email: "",
      branchId: String(ids.a),
    });
    const list = await parties.listParties(me, "customer", { search: tag });
    expect(list.items.map((i) => i.name)).toEqual([`${tag} Customer`]);
    await parties.saveParty(
      me,
      "customer",
      { name: `${tag} Customer 2`, branchId: String(ids.a) },
      created.id,
    );
    await parties.saveParty(me, "consignee", {
      name: `${tag} Penerima`,
      customerId: String(created.id),
      branchId: String(ids.a),
    });
    expect(
      (await parties.listParties(me, "consignee", { search: tag })).items[0]
        ?.columns,
    ).toContain(`${tag} Customer 2`);
    await parties.deleteParty(me, "customer", created.id);
    expect(
      (await parties.listParties(me, "customer", { search: tag })).total,
    ).toBe(0);
    expect(
      (await db.customer.findUnique({ where: { id: created.id } }))?.deletedAt,
    ).not.toBeNull();
  });

  it("denies other branches and requires an owned branch for non-admins", async () => {
    const other = await parties.saveParty(actor([], true), "customer", {
      name: `${tag} Other`,
      branchId: String(ids.b),
    });
    const me = actor([ids.a]);
    expect(
      (await parties.listParties(me, "customer", { search: `${tag} Other` }))
        .total,
    ).toBe(0);
    await expect(
      parties.saveParty(me, "customer", { name: `${tag} X` }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      parties.deleteParty(me, "customer", other.id),
    ).rejects.toMatchObject({
      status: 403,
    });
    const viewer = {
      ...me,
      group: {
        ...me.group,
        permissions: [{ resource: "customer", action: "view" }],
      },
    } as AccessActor;
    await expect(
      parties.saveParty(viewer, "customer", {
        name: `${tag} Y`,
        branchId: String(ids.a),
      }),
    ).rejects.toMatchObject({ status: 403 });
  });
});
