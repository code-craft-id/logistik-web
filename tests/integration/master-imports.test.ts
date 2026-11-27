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
const tag = `MI${randomUUID().slice(0, 8)}`;
const ids = {
  company: 0,
  office: 0,
  a: 0,
  b: 0,
  vendor: 0,
  service: 0,
  mode: 0,
};
type Libs = {
  consignees: typeof import("../../src/features/imports/server/consignees");
  vehicles: typeof import("../../src/features/imports/server/vehicles");
  vendors: typeof import("../../src/features/imports/server/vendor-tariffs");
};
let m: Libs;

const actor = (branchIds: number[]): AccessActor => ({
  id: 1,
  status: "ACTIVE",
  branchIds,
  group: {
    id: 1,
    name: "FAKE",
    status: "ACTIVE",
    deletedAt: null,
    permissions: ["consignee", "vehicle", "vendor"].flatMap((resource) =>
      ["view", "create", "update"].map((action) => ({ resource, action })),
    ),
  },
});
const file = (rows: unknown[][]) => {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), "S");
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
};
const row = (columns: string[], values: Record<string, unknown>) =>
  columns.map((c) => values[c] ?? "");

beforeAll(async () => {
  m = {
    consignees: await import("../../src/features/imports/server/consignees"),
    vehicles: await import("../../src/features/imports/server/vehicles"),
    vendors: await import("../../src/features/imports/server/vendor-tariffs"),
  };
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
  for (const key of ["a", "b"] as const)
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
  ids.vendor = (
    await db.vendor.create({
      data: {
        name: tag,
        address1: "x",
        address2: "",
        city: "x",
        postalCode: "0",
        phone: "0",
        fax: "",
        email: "fake@example.invalid",
        contactName: "x",
        branch: "x",
      },
    })
  ).id;
  ids.service = (await db.deliveryService.create({ data: { name: tag } })).id;
  ids.mode = (
    await db.transportMode.create({ data: { name: tag, divider: "6000" } })
  ).id;
});

afterAll(async () => {
  await db.vendorTariff.deleteMany({ where: { vendorId: ids.vendor } });
  await db.consignee.deleteMany({ where: { name: tag } });
  await db.vehicle.deleteMany({ where: { code: { startsWith: tag } } });
  await db.vendor.deleteMany({ where: { id: ids.vendor } });
  await db.deliveryService.deleteMany({ where: { id: ids.service } });
  await db.transportMode.deleteMany({ where: { id: ids.mode } });
  await db.branch.deleteMany({ where: { id: { in: [ids.a, ids.b] } } });
  await db.office.deleteMany({ where: { id: ids.office } });
  await db.company.deleteMany({ where: { id: ids.company } });
  await db.$disconnect();
});

describe("master imports", () => {
  it("consignee: file id, blank cells kept, other branch refused", async () => {
    const columns = m.consignees.CONSIGNEE_COLUMNS;
    const id = (await m.consignees.lastConsigneeId(actor([ids.a]))) + 3;
    const make = (branch: number, phone: string, key = id) =>
      file([
        columns,
        row(columns, {
          Unique: key,
          "Consignee Name": tag,
          Branch: branch,
          Phone: phone,
          Fax: "021",
        }),
      ]);
    const a = actor([ids.a]);
    await expect(
      m.consignees.importConsignees(a, make(ids.b, "1")),
    ).rejects.toMatchObject({ code: "FORBIDDEN_BRANCH" });
    await m.consignees.importConsignees(a, make(ids.a, "0800"));
    await m.consignees.importConsignees(a, make(ids.a, ""));
    expect(await db.consignee.findUnique({ where: { id } })).toMatchObject({
      phone: "0800",
      fax: "021",
    });
  });

  it("vehicle: Kode is the key and a plate cannot be taken", async () => {
    const columns = m.vehicles.VEHICLE_COLUMNS;
    const make = (code: string, brand: string) =>
      file([
        ["Template Import Vehicle"],
        [],
        columns,
        row(columns, {
          Kode: `${tag}${code}`,
          Merk: brand,
          Tahun: 2024,
          "No. Polisi": tag,
          "STNK Date": "2024-01-12",
          Panjang: 3,
          "Branch ID": ids.a,
        }),
        // The provider file pre-fills a date in unused rows.
        row(columns, { "STNK Date": "2024-01-12" }),
      ]);
    const a = actor([ids.a]);
    await m.vehicles.importVehicles(a, make("1", "FAKE"));
    expect(await m.vehicles.importVehicles(a, make("1", "LAIN"))).toContain(
      "1 diperbarui",
    );
    const saved = await db.vehicle.findUnique({ where: { code: `${tag}1` } });
    expect(saved).toMatchObject({ brand: "LAIN", year: 2024 });
    expect(saved?.registrationDate?.toISOString()).toContain("2024-01-12");
    await expect(
      m.vehicles.importVehicles(a, make("2", "FAKE")),
    ).rejects.toThrow("sudah dipakai");
  });

  it("vendor price list: flat price, upsert, export", async () => {
    const columns = m.vendors.VENDOR_TARIFF_COLUMNS;
    const unique = Math.floor(Math.random() * 100_000_000) + 1_000_000;
    const make = (price: number, vendor = ids.vendor) =>
      file([
        columns,
        [unique, vendor, ids.service, ids.mode, ids.a, ids.b, "", "", price, 2],
      ]);
    const a = actor([ids.a]);
    await m.vendors.importVendorTariffs(a, make(2000));
    await m.vendors.importVendorTariffs(a, make(3000));
    const rows = await db.vendorTariff.findMany({
      where: { vendorId: ids.vendor },
    });
    expect(rows.map((r) => r.nextPrice.toString())).toEqual(["3000"]);
    await expect(
      m.vendors.importVendorTariffs(a, make(1, 999_999_999)),
    ).rejects.toThrow("ID Vendor");
    const book = XLSX.read(await m.vendors.vendorTariffExport(a, ids.vendor));
    expect(XLSX.utils.sheet_to_csv(book.Sheets.Data)).toContain("3000");
  });
});
