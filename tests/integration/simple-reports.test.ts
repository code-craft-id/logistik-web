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
process.env.DATABASE_URL = url;
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});
const tag = `SR${randomUUID().slice(0, 10)}`;
const ids = {
  company: 0,
  office: 0,
  a: 0,
  b: 0,
  customer: 0,
  cost: 0,
  vendor: 0,
  tx: [] as number[],
  manifest: 0,
  sheet: 0,
};
let reports: typeof import("../../src/features/reports/simple/definitions");
let framework: typeof import("../../src/features/reports/simple/framework");
const actor = (branchIds: number[], admin = false): AccessActor => ({
  id: 1,
  status: "ACTIVE",
  branchIds,
  group: {
    id: 1,
    name: "FAKE",
    status: "ACTIVE",
    deletedAt: null,
    permissions: admin ? [{ resource: "system_admin", action: "manage" }] : [],
  },
});

beforeAll(async () => {
  reports = await import("../../src/features/reports/simple/definitions");
  framework = await import("../../src/features/reports/simple/framework");
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
  ids.customer = (
    await db.customer.create({
      data: { name: `${tag} Customer`, branchId: ids.a },
    })
  ).id;
  ids.cost = (await db.costType.create({ data: { name: `${tag} CASH` } })).id;
  const vendor = await db.$queryRaw<
    { id: number }[]
  >`SELECT id FROM vendors WHERE deleted_at IS NULL ORDER BY id LIMIT 1`;
  ids.vendor = vendor[0]?.id ?? 0;
  for (const [n, biaya, dest] of [
    ["1", "100000.00", ids.b],
    ["2", "50000.00", ids.b],
    ["3", null, ids.a],
  ] as const)
    ids.tx.push(
      (
        await db.transaction.create({
          data: {
            awbNo: `${tag}-${n}`,
            transactionDate: new Date("2026-11-03T10:00:00Z"),
            originBranchId: ids.a,
            destinationBranchId: dest,
            koli: 1,
            kilo: "2.00",
            biaya,
            customerId: n === "3" ? null : ids.customer,
            costTypeId: ids.cost,
          },
        })
      ).id,
    );
  ids.manifest = (
    await db.manifest.create({
      data: {
        manifestNo: `${tag}-M`,
        manifestDate: new Date("2026-11-04T00:00:00Z"),
        branchId: ids.a,
        vendorId: ids.vendor || null,
      },
    })
  ).id;
  await db.manifestItem.createMany({
    data: ids.tx
      .slice(0, 2)
      .map((transactionId) => ({ manifestId: ids.manifest, transactionId })),
  });
  ids.sheet = (
    await db.deliverySheet.create({
      data: {
        sheetNo: `${tag}-D`,
        manifestId: ids.manifest,
        deliveryDate: new Date("2026-11-05T00:00:00Z"),
      },
    })
  ).id;
  await db.deliverySheetItem.createMany({
    data: [
      {
        deliverySheetId: ids.sheet,
        transactionId: ids.tx[0],
        outcome: "DELIVERED",
        receivedBy: "FAKE R",
      },
      {
        deliverySheetId: ids.sheet,
        transactionId: ids.tx[1],
        outcome: "FAILED_DELIVERY",
      },
    ],
  });
});

afterAll(async () => {
  await db.deliverySheetItem.deleteMany({
    where: { deliverySheetId: ids.sheet },
  });
  await db.deliverySheet.deleteMany({ where: { id: ids.sheet } });
  await db.manifestItem.deleteMany({ where: { manifestId: ids.manifest } });
  await db.manifest.deleteMany({ where: { id: ids.manifest } });
  await db.transaction.deleteMany({ where: { id: { in: ids.tx } } });
  await db.costType.deleteMany({ where: { id: ids.cost } });
  await db.customer.deleteMany({ where: { id: ids.customer } });
  await db.branch.deleteMany({ where: { id: { in: [ids.a, ids.b] } } });
  await db.office.deleteMany({ where: { id: ids.office } });
  await db.company.deleteMany({ where: { id: ids.company } });
  await db.$disconnect();
});

const run = async (id: string, who: AccessActor, branchId: number | null) => {
  const parsed = framework.parseFilters(
    {
      startDate: "2026-11-01",
      endDate: "2026-11-15",
      ...(branchId ? { branchId: String(branchId) } : {}),
    },
    who.branchIds,
    who.branchIds.length === 0,
  );
  if (!parsed.ok) throw new Error(parsed.message);
  return db.$transaction((tx) =>
    reports.simpleReports[id].run(who, parsed.filters, tx),
  );
};

describe("simple reports", () => {
  it("every report query runs for admins and scoped users", async () => {
    for (const id of Object.keys(reports.simpleReports)) {
      await expect(run(id, actor([], true), ids.a)).resolves.toHaveProperty(
        "rows",
      );
      await expect(run(id, actor([ids.b]), null)).resolves.toHaveProperty(
        "rows",
      );
    }
  });

  it("computes the documented definitions from source rows", async () => {
    const customer = await run("customer-monthly", actor([ids.a]), ids.a);
    expect(customer.rows).toContainEqual(
      expect.objectContaining({
        customer: `${tag} Customer`,
        awb: 2,
        biaya: "150000.00",
      }),
    );
    const turnover = await run("daily-turnover", actor([ids.a]), ids.a);
    expect(turnover.totals).toMatchObject({ awb: 3, biaya: "150000.00" });
    const inbound = await run("inbound", actor([ids.b]), ids.b);
    expect(inbound.rows.map((r) => r.awb).sort()).toEqual([
      `${tag}-1`,
      `${tag}-2`,
    ]);
    const courier = await run("courier", actor([ids.a]), ids.a);
    expect(courier.totals).toMatchObject({ awb: 2, berhasil: 1, gagal: 1 });
    const gp = await run("gross-profit", actor([ids.a]), ids.a);
    expect(gp.rows[0]).toMatchObject({
      awb: 2,
      pendapatan: "150000.00",
      biaya: "0",
      tanpa_biaya: 2,
    });
    const pod = await run("pod", actor([ids.a]), ids.a);
    expect(pod.rows).toEqual([
      expect.objectContaining({ awb: `${tag}-1`, diterima: "FAKE R" }),
    ]);
    const outside = await run("customer-monthly", actor([ids.b + 1000]), null);
    expect(outside.rows).toEqual([]);
  });

  it("keeps different customers with the same name on separate rows", async () => {
    const twin = await db.customer.create({
      data: { name: `${tag} Customer`, branchId: ids.a },
    });
    const extra = await db.transaction.create({
      data: {
        awbNo: `${tag}-T`,
        transactionDate: new Date("2026-11-03T10:00:00Z"),
        originBranchId: ids.a,
        destinationBranchId: ids.b,
        customerId: twin.id,
        biaya: "1.00",
      },
    });
    try {
      const result = await run("customer-monthly", actor([ids.a]), ids.a);
      expect(
        result.rows.filter((r) => r.customer === `${tag} Customer`),
      ).toHaveLength(2);
    } finally {
      await db.transaction.delete({ where: { id: extra.id } });
      await db.customer.delete({ where: { id: twin.id } });
    }
  });

  it("reconciles totals across reports and with direct database counts", async () => {
    const who = actor([ids.a]);
    const scope = {
      deletedAt: null,
      transactionDate: {
        gte: new Date("2026-11-01T00:00:00Z"),
        lt: new Date("2026-11-16T00:00:00Z"),
      },
      OR: [{ originBranchId: ids.a }, { destinationBranchId: ids.a }],
    };
    const direct = await db.transaction.aggregate({
      where: scope,
      _count: { _all: true },
      _sum: { biaya: true, koli: true },
    });
    const customer = await run("customer-monthly", who, ids.a);
    const turnover = await run("daily-turnover", who, ids.a);
    for (const r of [customer, turnover]) {
      expect(r.totals?.awb).toBe(direct._count._all);
      expect(r.totals?.koli).toBe(direct._sum.koli);
      expect(r.totals?.biaya).toBe(direct._sum.biaya?.toFixed(2));
      // AWB 3 has no biaya: reported as incomplete, not silently complete.
      expect(r.totals?.tidak_lengkap).toBe(1);
    }
    const activeItems = await db.manifestItem.count({
      where: {
        manifest: { branchId: ids.a, deletedAt: null },
        deletedAt: null,
        releasedAt: null,
      },
    });
    const gp = await run("gross-profit", who, ids.a);
    const recap = await run("gross-profit-recap", who, ids.a);
    const vendor = await run("manifest-vendor", who, ids.a);
    expect(gp.totals?.awb).toBe(activeItems);
    expect(recap.totals?.awb).toBe(activeItems);
    expect(vendor.totals?.awb).toBe(activeItems);
    expect(recap.totals?.pendapatan).toBe(gp.totals?.pendapatan);
    expect(recap.totals?.gp).toBe(gp.totals?.gp);
    const courier = await run("courier", who, ids.a);
    const t = courier.totals ?? {};
    expect(
      Number(t.berhasil) + Number(t.gagal) + Number(t.retur) + Number(t.proses),
    ).toBe(t.awb);
  });

  it("validates the period and branch filters", () => {
    expect(
      framework.parseFilters(
        { startDate: "2026-01-01", endDate: "2026-12-31" },
        [],
        true,
      ),
    ).toMatchObject({ ok: false });
    expect(framework.parseFilters({ branchId: "5" }, [1], false)).toMatchObject(
      { ok: false },
    );
    expect(framework.parseFilters({}, [1], false)).toMatchObject({ ok: true });
  });
});
