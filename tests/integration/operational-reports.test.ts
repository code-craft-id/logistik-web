import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loadAccessActor } from "../../src/features/identity/server/access";
import { createOperationalReportService } from "../../src/features/reports/operational/server/service";
import { type Prisma, PrismaClient } from "../../src/lib/db/generated/client";
import { testDatabaseUrl } from "../support/test-database-url";

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: testDatabaseUrl(
      process.env.TEST_DATABASE_URL,
      process.env.DATABASE_URL,
    ),
  }),
});
const tag = `OP${randomUUID().slice(0, 12)}`;
const period = {
  startDate: "2026-11-01",
  endDate: "2026-11-15",
  search: tag,
  pageSize: "100",
};
const companyIds: number[] = [],
  officeIds: number[] = [],
  branchIds: number[] = [],
  groupIds: number[] = [],
  userIds: number[] = [],
  transactionIds: number[] = [],
  manifestIds: number[] = [],
  sheetIds: number[] = [];
let main: number,
  hidden: number,
  unowned: number,
  inactive: number,
  deleted: number,
  before: number,
  cutoff: number,
  other: number;
let a: number,
  b: number,
  c: number,
  d: number,
  txA: number,
  txB: number,
  txHidden: number,
  txDeleted: number,
  txNull: number,
  txMixed: number,
  sheetMain: number,
  itemReleased: number;
const read = (user: number) =>
  createOperationalReportService(db, () => loadAccessActor(db, user));
async function transaction(
  suffix: string,
  data: Partial<Prisma.TransactionUncheckedCreateInput> = {},
) {
  const row = await db.transaction.create({
    data: {
      awbNo: `${tag}-${suffix}`,
      transactionDate: new Date("2026-11-03T12:00:00Z"),
      originBranchId: a,
      destinationBranchId: c,
      receiverName: "FAKE Receiver",
      biaya: "123.45",
      ...data,
    },
  });
  transactionIds.push(row.id);
  return row.id;
}
async function manifest(
  suffix: string,
  data: Partial<Prisma.ManifestUncheckedCreateInput> = {},
) {
  const row = await db.manifest.create({
    data: {
      manifestNo: `${tag}-${suffix}`,
      manifestDate: new Date("2026-11-02T12:00:00Z"),
      branchId: a,
      type: "Transit",
      ...data,
    },
  });
  manifestIds.push(row.id);
  return row.id;
}
async function sheet(
  manifestId: number,
  suffix: string,
  date = "2026-11-03T12:00:00Z",
) {
  const row = await db.deliverySheet.create({
    data: {
      manifestId,
      sheetNo: `${tag}-DRS-${suffix}`,
      deliveryDate: new Date(date),
    },
  });
  sheetIds.push(row.id);
  return row.id;
}
async function item(
  deliverySheetId: number,
  transactionId: number,
  data: Partial<Prisma.DeliverySheetItemUncheckedCreateInput> = {},
) {
  return (
    await db.deliverySheetItem.create({
      data: { deliverySheetId, transactionId, ...data },
    })
  ).id;
}
beforeAll(async () => {
  const company = await db.company.create({
    data: { name: tag, isDepositAgent: false, showPriceOnPrint: false },
  });
  companyIds.push(company.id);
  const office = await db.office.create({
    data: { companyId: company.id, name: tag, code: tag, status: "ACTIVE" },
  });
  officeIds.push(office.id);
  for (let i = 0; i < 4; i++)
    branchIds.push(
      (
        await db.branch.create({
          data: {
            officeId: office.id,
            name: `FAKE ${tag} ${i}`,
            code: `${tag}${i}`,
            status: i === 3 ? "INACTIVE" : "ACTIVE",
          },
        })
      ).id,
    );
  [a, b, c, d] = branchIds;
  for (let i = 0; i < 5; i++) {
    const permissions =
      i === 0
        ? [{ resource: "system_admin", action: "manage" }]
        : i === 2
          ? [
              { resource: "manifest", action: "view" },
              { resource: "delivery", action: "view" },
            ]
          : i === 4
            ? [{ resource: "dashboard_report", action: "view" }]
            : ["manifest_report", "delivery_report", "dashboard_report"].map(
                (resource) => ({ resource, action: "view" }),
              );
    const group = await db.userGroup.create({
      data: {
        name: `${tag}${i}`,
        status: "ACTIVE",
        permissions: { create: permissions },
      },
    });
    groupIds.push(group.id);
    userIds.push(
      (
        await db.user.create({
          data: {
            name: "FAKE operational report user",
            email: `${randomUUID()}@example.invalid`,
            status: "ACTIVE",
            groupId: group.id,
            allowedBranches: {
              create: (i === 3 ? [] : [a, b, d]).map((branchId) => ({
                branchId,
              })),
            },
          },
        })
      ).id,
    );
  }
  txA = await transaction("A", {
    status: "Cancelled",
    koli: 0,
    kilo: "0.10",
    volume: "0.001",
  });
  txB = await transaction("B", {
    originBranchId: c,
    destinationBranchId: b,
    koli: 3,
    kilo: "0.20",
    volume: null,
  });
  txHidden = await transaction("H", {
    originBranchId: c,
    destinationBranchId: c,
  });
  txDeleted = await transaction("D", { deletedAt: new Date() });
  txNull = await transaction("N", {
    originBranchId: null,
    destinationBranchId: null,
  });
  txMixed = await transaction("X", {
    originBranchId: d,
    destinationBranchId: a,
  });
  await transaction("I", {
    originBranchId: d,
    destinationBranchId: null,
  });
  main = await manifest("main", { originBranchId: a, destinationBranchId: c });
  other = await manifest("other", { branchId: b });
  hidden = await manifest("hidden", {
    branchId: c,
    originBranchId: a,
    destinationBranchId: a,
  });
  unowned = await manifest("null", { branchId: null, originBranchId: a });
  inactive = await manifest("inactive", { branchId: d });
  deleted = await manifest("deleted", { deletedAt: new Date() });
  before = await manifest("before", {
    manifestDate: new Date("2026-10-31T23:59:59.999Z"),
  });
  cutoff = await manifest("cutoff", {
    manifestDate: new Date("2026-11-16T00:00:00Z"),
  });
  for (let i = 0; i < 30; i++) await manifest(`page-${i}`);
  for (const [transactionId, options] of [
    [txA, {}],
    [txHidden, {}],
    [txB, { releasedAt: new Date() }],
    [txDeleted, {}],
    [txMixed, { deletedAt: new Date() }],
  ] as const)
    await db.manifestItem.create({
      data: { manifestId: main, transactionId, ...options },
    });
  sheetMain = await sheet(main, "main");
  await item(sheetMain, txA, {
    outcome: "DELIVERED",
    deliveredAt: new Date("2026-11-20T00:00:00Z"),
    receivedBy: "FAKE Receiver",
    notes: "FAKE note",
  });
  itemReleased = await item(sheetMain, txB, {
    outcome: "EXCEPTION",
    deliveredAt: null,
  });
  await item(sheetMain, txHidden);
  await item(sheetMain, txDeleted);
  await item(sheetMain, txMixed, { deletedAt: new Date() });
  await item(await sheet(hidden, "hidden"), txA);
  await item(await sheet(other, "other"), txHidden);
  await item(await sheet(unowned, "null"), txNull);
  await item(await sheet(inactive, "inactive"), txMixed);
  await item(await sheet(deleted, "deleted"), txA);
  await item(await sheet(before, "before", "2026-10-31T23:59:59.999Z"), txA);
  await item(await sheet(cutoff, "cutoff", "2026-11-16T00:00:00Z"), txA);
}, 30_000);
afterAll(async () => {
  await db.deliverySheetItem.deleteMany({
    where: { deliverySheetId: { in: sheetIds } },
  });
  await db.deliverySheet.deleteMany({ where: { id: { in: sheetIds } } });
  await db.manifestItem.deleteMany({
    where: { manifestId: { in: manifestIds } },
  });
  await db.manifest.deleteMany({ where: { id: { in: manifestIds } } });
  await db.transaction.deleteMany({ where: { id: { in: transactionIds } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.userGroup.deleteMany({ where: { id: { in: groupIds } } });
  await db.branch.deleteMany({ where: { id: { in: branchIds } } });
  await db.office.deleteMany({ where: { id: { in: officeIds } } });
  await db.company.deleteMany({ where: { id: { in: companyIds } } });
  await db.$disconnect();
});

describe("guarded operational report real sources", () => {
  it("requires independent report rights, rejects forged branches and fails closed without scope", async () => {
    await expect(
      createOperationalReportService(db, async () => null).read(
        "manifest",
        period,
      ),
    ).rejects.toMatchObject({ status: 401 });
    for (const kind of ["manifest", "delivery", "dashboard"] as const)
      await expect(
        read(userIds[2]).read(
          kind,
          kind === "dashboard"
            ? { startDate: period.startDate, endDate: period.endDate }
            : period,
        ),
      ).rejects.toMatchObject({ status: 403 });
    await expect(
      read(userIds[1]).read("manifest", { ...period, branchId: String(c) }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      read(userIds[0]).read("manifest", { ...period, branchId: "2147483647" }),
    ).rejects.toMatchObject({ status: 403 });
    expect((await read(userIds[3]).read("delivery", period)).total).toBe(0);
    const unavailable = await read(userIds[1]).read("vendor", {});
    expect(unavailable.state).toBe("unavailable");
    expect(unavailable.items).toEqual([]);
  });
  it("scopes manifests by owner not geography and counts only active visible assignments", async () => {
    const result = await read(userIds[1]).read("manifest", period);
    expect(result.total).toBe(32);
    expect(result.items).toHaveLength(32);
    const ids = result.items.map((row) => row.id);
    for (const id of [hidden, unowned, inactive, deleted, before, cutoff])
      expect(ids).not.toContain(id);
    expect(result.kind).toBe("manifest");
    if (result.kind !== "manifest") throw new Error("kind");
    expect(result.items.find((row) => row.id === main)).toMatchObject({
      type: "Transit",
      originBranch: (await db.branch.findUniqueOrThrow({ where: { id: a } }))
        .name,
      destinationBranch: (
        await db.branch.findUniqueOrThrow({ where: { id: c } })
      ).name,
      assignedTransactions: 1,
      totalKoli: 0,
      totalKilo: "0.1",
      totalVolume: "0.001",
      vehicle: null,
      courier: null,
    });
    expect(JSON.stringify(result)).not.toMatch(
      /biaya|123\.45|idempotencyKey|createdById/,
    );
    expect(result.branches.map((branch) => branch.id)).toEqual(
      expect.arrayContaining([a, b]),
    );
    expect(result.branches.map((branch) => branch.id)).not.toContain(d);
    expect(result.branches.map((branch) => branch.id)).not.toContain(c);
    const admin = await read(userIds[0]).read("manifest", period);
    expect(admin.items.map((row) => row.id)).toEqual(
      expect.arrayContaining([hidden, unowned, inactive]),
    );
    expect(admin.branches.map((branch) => branch.id)).toContain(d);
  });
  it("keeps strict stable manifest paging on duplicate dates", async () => {
    const first = await read(userIds[1]).read("manifest", {
      ...period,
      pageSize: "2",
    });
    const next = await read(userIds[1]).read("manifest", {
      ...period,
      pageSize: "2",
      page: "2",
    });
    expect(first.total).toBe(32);
    expect(next.total).toBe(32);
    expect(
      first.items
        .map((row) => row.id)
        .some((id) => next.items.some((row) => row.id === id)),
    ).toBe(false);
    expect(first.items[0].id).toBeGreaterThan(next.items[0].id);
  });
  it("preserves per-DRS grain and item intersection scope including released history", async () => {
    const sheets = await read(userIds[1]).read("delivery", period);
    expect(sheets.kind).toBe("sheets");
    expect(sheets.total).toBe(1);
    if (sheets.kind !== "sheets") throw new Error("kind");
    expect(sheets.items).toHaveLength(1);
    expect(sheets.items[0]).toMatchObject({
      id: sheetMain,
      visibleTransactions: 2,
      totalKoli: 3,
      totalKilo: "0.3",
      totalVolume: null,
    });
    expect(sheets.items[0]).not.toHaveProperty("status");
    const items = await read(userIds[1]).read("delivery", {
      ...period,
      view: "items",
    });
    expect(items.kind).toBe("items");
    expect(items.total).toBe(2);
    if (items.kind !== "items") throw new Error("kind");
    expect(items.items.map((row) => row.id)).toContain(itemReleased);
    expect(
      items.items.find((row) => row.outcome === "DELIVERED")?.deliveredAt,
    ).toBe("2026-11-20T00:00:00.000Z");
    expect(
      items.items.find((row) => row.outcome === "EXCEPTION")?.deliveredAt,
    ).toBeNull();
    const admin = await read(userIds[0]).read("delivery", period);
    expect(admin.total).toBe(5);
    const adminItems = await read(userIds[0]).read("delivery", {
      ...period,
      view: "items",
    });
    expect(adminItems.total).toBe(7);
  });
  it("uses raw count units and per-source dates with declared branch attribution", async () => {
    const result = await read(userIds[1]).read("dashboard", {
      startDate: period.startDate,
      endDate: period.endDate,
      branchId: String(a),
    });
    if (result.kind !== "dashboard") throw new Error("kind");
    expect(result.counts).toEqual({
      transactions: 2,
      manifests: 31,
      sheets: 1,
      items: 2,
    });
    const dashOnly = await read(userIds[4]).read("dashboard", {
      startDate: period.startDate,
      endDate: period.endDate,
      branchId: String(a),
    });
    expect(dashOnly.links).toEqual({
      manifest: false,
      delivery: false,
      transaction: false,
    });
    // Legacy widgets: pending/status from sources, detail gated by rights.
    if (result.kind !== "dashboard" || dashOnly.kind !== "dashboard") return;
    const insights = result.insights;
    expect(insights?.statuses.reduce((n, row) => n + row.count, 0)).toBe(2);
    // Daily series covers every period day and sums to the scoped count.
    expect(insights?.daily).toHaveLength(15);
    expect(insights?.daily.reduce((n, day) => n + day.count, 0)).toBe(2);
    expect(insights?.awbPending).toBeGreaterThanOrEqual(0);
    expect(insights?.awbPending).toBeLessThanOrEqual(2);
    expect(insights?.recent).toBeNull();
    expect(insights?.invoices).toBeNull();
    expect(insights?.actions.map((x) => x.label)).toEqual([
      "Manifest",
      "Delivery Sheet",
    ]);
    expect(dashOnly.insights?.actions).toEqual([]);
    const admin = await read(userIds[0]).read("dashboard", {
      startDate: period.startDate,
      endDate: period.endDate,
      branchId: String(a),
    });
    if (admin.kind !== "dashboard") throw new Error("kind");
    expect(admin.insights?.recent?.length).toBeGreaterThan(0);
    expect(admin.insights?.invoices).toMatchObject({
      outstanding: expect.stringMatching(/^\d+\.\d{2}$/),
    });
  });
  it("reloads grants, memberships and ACTIVE hierarchy on every request", async () => {
    await db.permission.deleteMany({
      where: { groupId: groupIds[1], resource: "manifest_report" },
    });
    try {
      await expect(
        read(userIds[1]).read("manifest", period),
      ).rejects.toMatchObject({ status: 403 });
    } finally {
      await db.permission.create({
        data: {
          groupId: groupIds[1],
          resource: "manifest_report",
          action: "view",
        },
      });
    }
    await db.userAllowedBranch.deleteMany({
      where: { userId: userIds[1], branchId: a },
    });
    try {
      expect(
        (
          await read(userIds[1]).read("manifest", {
            ...period,
            search: `${tag}-main`,
          })
        ).total,
      ).toBe(0);
      await expect(
        read(userIds[1]).read("manifest", { ...period, branchId: String(a) }),
      ).rejects.toMatchObject({ status: 403 });
    } finally {
      await db.userAllowedBranch.create({
        data: { userId: userIds[1], branchId: a },
      });
    }
    await db.office.update({
      where: { id: officeIds[0] },
      data: { status: "INACTIVE" },
    });
    try {
      const empty = await read(userIds[1]).read("delivery", period);
      expect(empty.total).toBe(0);
      expect(empty.branches).toEqual([]);
    } finally {
      await db.office.update({
        where: { id: officeIds[0] },
        data: { status: "ACTIVE" },
      });
    }
  });
  it("treats identifier wildcard characters literally and applies UTC inclusive boundaries", async () => {
    const literal = await manifest("literal_%\\");
    await manifest("literalABC");
    for (const search of ["literal_", "%", "\\"]) {
      const result = await read(userIds[1]).read("manifest", {
        ...period,
        search,
      });
      expect(result.total).toBe(1);
      expect(result.items.map((row) => row.id)).toEqual([literal]);
    }
    const edge = await manifest("edge", {
      manifestDate: new Date("2026-11-01T00:00:00Z"),
    });
    const result = await read(userIds[1]).read("manifest", period);
    expect(result.items.map((row) => row.id)).toContain(edge);
    expect(result.items.map((row) => row.id)).not.toContain(cutoff);
  });
  it("holds one count snapshot while a real external writer commits between dashboard reads", async () => {
    const query = {
      startDate: period.startDate,
      endDate: period.endDate,
      branchId: String(a),
    };
    const old = await read(userIds[1]).read("dashboard", query);
    if (old.kind !== "dashboard") throw new Error("kind");
    let inserted = false;
    const wrapped = new Proxy(db, {
      get(target, key) {
        if (key !== "$transaction") return Reflect.get(target, key);
        return (
          work: (tx: Prisma.TransactionClient) => Promise<unknown>,
          options: object,
        ) =>
          db.$transaction(
            (tx) =>
              work(
                new Proxy(tx, {
                  get(inner, model) {
                    if (model !== "transaction")
                      return Reflect.get(inner, model);
                    return new Proxy(tx.transaction, {
                      get(delegate, method) {
                        if (method !== "count")
                          return Reflect.get(delegate, method);
                        return async (args: Prisma.TransactionCountArgs) => {
                          const value = await tx.transaction.count(args);
                          if (!inserted) {
                            inserted = true;
                            await manifest("concurrent");
                          }
                          return value;
                        };
                      },
                    });
                  },
                }),
              ),
            options,
          );
      },
    });
    const result = await createOperationalReportService(wrapped, () =>
      loadAccessActor(db, userIds[1]),
    ).read("dashboard", query);
    if (result.kind !== "dashboard") throw new Error("kind");
    expect(inserted).toBe(true);
    expect(result.counts).toEqual(old.counts);
    const next = await read(userIds[1]).read("dashboard", query);
    if (next.kind !== "dashboard" || !next.counts || !old.counts)
      throw new Error("counts");
    expect(next.counts.manifests).toBe(old.counts.manifests + 1);
  });
});
