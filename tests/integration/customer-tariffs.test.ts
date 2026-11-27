import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import type { AccessActor } from "../../src/features/identity/permissions";
import { PrismaClient } from "../../src/lib/db/generated/client";
import { testDatabaseUrl } from "../support/test-database-url";

const url = testDatabaseUrl(
  process.env.TEST_DATABASE_URL,
  process.env.DATABASE_URL,
);
process.env.DATABASE_URL = url;
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});
const tag = `CT${randomUUID().slice(0, 8)}`;
const ids = {
  company: 0,
  office: 0,
  a: 0,
  b: 0,
  customerA: 0,
  customerB: 0,
  service: 0,
  mode: 0,
  truck: 0,
};
let m: typeof import("../../src/features/sales/server/customer-tariffs");

const actor = (branchIds: number[]): AccessActor => ({
  id: 1,
  status: "ACTIVE",
  branchIds,
  group: {
    id: 1,
    name: "FAKE",
    status: "ACTIVE",
    deletedAt: null,
    permissions: [
      { resource: "customer", action: "view" },
      { resource: "customer", action: "create" },
      { resource: "customer", action: "update" },
    ],
  },
});
const file = (
  pricing: "KOLI" | "TRUCKING",
  rows: [unique: number, customer: number, service: number][],
) => {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.aoa_to_sheet([
      m.tariffColumns(pricing),
      ...rows.map(([unique, customer, service]) => [
        unique,
        customer,
        "x",
        service,
        "x",
        ids.mode,
        "x",
        ids.a,
        "x",
        ids.b,
        1000,
        3,
      ]),
    ]),
    "S",
  );
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
};
const base = Math.floor(Math.random() * 100_000_000) + 1_000_000;

beforeAll(async () => {
  m = await import("../../src/features/sales/server/customer-tariffs");
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
  for (const key of ["a", "b"] as const) {
    ids[key] = (
      await db.branch.create({
        data: {
          officeId: ids.office,
          name: `${tag}${key}`,
          code: `${tag}${key}`,
          status: "ACTIVE",
        },
      })
    ).id;
    ids[key === "a" ? "customerA" : "customerB"] = (
      await db.customer.create({
        data: { name: `${tag} ${key}`, branchId: ids[key] },
      })
    ).id;
  }
  ids.service = (await db.deliveryService.create({ data: { name: tag } })).id;
  ids.mode = (
    await db.transportMode.create({ data: { name: tag, divider: "6000" } })
  ).id;
  ids.truck = (await db.truckingType.create({ data: { name: tag } })).id;
});

afterAll(async () => {
  await db.customerTariff.deleteMany({
    where: { customerId: { in: [ids.customerA, ids.customerB] } },
  });
  await db.customer.deleteMany({
    where: { id: { in: [ids.customerA, ids.customerB] } },
  });
  await db.deliveryService.deleteMany({ where: { id: ids.service } });
  await db.transportMode.deleteMany({ where: { id: ids.mode } });
  await db.truckingType.deleteMany({ where: { id: ids.truck } });
  await db.branch.deleteMany({ where: { id: { in: [ids.a, ids.b] } } });
  await db.office.deleteMany({ where: { id: ids.office } });
  await db.company.deleteMany({ where: { id: ids.company } });
  await db.$disconnect();
});

describe("customer tariff import", () => {
  it("saves all rows or none and keeps branch scope", async () => {
    const a = actor([ids.a]);
    const saved = () =>
      db.customerTariff.count({
        where: { customerId: { in: [ids.customerA, ids.customerB] } },
      });
    await expect(
      m.importCustomerTariffs(
        a,
        "KOLI",
        file("KOLI", [
          [base, ids.customerA, ids.service],
          [base + 1, ids.customerB, ids.service],
        ]),
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN_BRANCH" });
    expect(await saved()).toBe(0);

    const own = file("KOLI", [[base, ids.customerA, ids.service]]);
    await m.importCustomerTariffs(a, "KOLI", own);
    await m.importCustomerTariffs(a, "KOLI", own);
    expect(await saved()).toBe(1);
    // Another branch cannot take over an existing Unique.
    await expect(
      m.importCustomerTariffs(
        actor([ids.b]),
        "KOLI",
        file("KOLI", [[base, ids.customerB, ids.service]]),
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN_BRANCH" });

    await m.importCustomerTariffs(
      a,
      "TRUCKING",
      file("TRUCKING", [[base, ids.customerA, ids.truck]]),
    );
    const { rows } = await m.listCustomerTariffs(a, "TRUCKING", ids.customerA);
    expect(rows.map(m.serviceName)).toEqual([tag]);
    expect(
      (await m.listCustomerTariffs(actor([ids.b]), "KOLI", ids.customerA)).rows,
    ).toEqual([]);
  });
});

describe("customer import", () => {
  it("creates with the file's id, updates without wiping, keeps scope", async () => {
    const lib = await import("../../src/features/sales/server/customer-import");
    const a = actor([ids.a]);
    const top = await db.customer.aggregate({ _max: { id: true } });
    const id = (top._max.id ?? 0) + 5;
    const sheet = (rows: unknown[][]) => {
      const book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        book,
        XLSX.utils.aoa_to_sheet([lib.CUSTOMER_COLUMNS, ...rows]),
        "S",
      );
      return XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
    };
    const row = (key: number, name: string, branch: number, phone: string) => [
      key,
      name,
      "Jalan 1",
      "Blok 2",
      "",
      "",
      phone,
      "",
      "",
      "",
      "",
      branch,
      "",
      1,
    ];
    try {
      await expect(
        lib.importCustomers(
          a,
          sheet([row(id, tag, ids.a, "0800"), row(id + 1, tag, ids.b, "")]),
        ),
      ).rejects.toMatchObject({ code: "FORBIDDEN_BRANCH" });
      expect(await db.customer.count({ where: { id } })).toBe(0);

      await lib.importCustomers(a, sheet([row(id, tag, ids.a, "0800")]));
      await lib.importCustomers(a, sheet([row(id, `${tag}X`, ids.a, "")]));
      expect(await db.customer.findUnique({ where: { id } })).toMatchObject({
        name: `${tag}X`,
        phone: "0800",
        address: "Jalan 1, Blok 2",
        podRequired: true,
      });
      // The sequence moved past the given id.
      const next = await db.customer.create({ data: { name: tag } });
      expect(next.id).toBeGreaterThan(id);
      await db.customer.delete({ where: { id: next.id } });
      await expect(
        lib.importCustomers(a, sheet([row(id + 900_000, tag, ids.a, "")])),
      ).rejects.toThrow("terlalu jauh");
    } finally {
      await db.customer.deleteMany({ where: { id } });
    }
  });
});
