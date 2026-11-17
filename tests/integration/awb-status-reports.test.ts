import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loadAccessActor } from "../../src/features/identity/server/access";
import { createAwbStatusReportService } from "../../src/features/reports/awb-status/server/service";
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
const tag = `AS${randomUUID().slice(0, 12)}`;
const period = {
  startDate: "2026-11-01",
  endDate: "2026-11-15",
  search: tag,
  pageSize: "100",
};
const ids = {
  company: [] as number[],
  office: [] as number[],
  branch: [] as number[],
  group: [] as number[],
  user: [] as number[],
  transaction: [] as number[],
  manifest: [] as number[],
  sheet: [] as number[],
};
let a: number, b: number, c: number;
let admin: number,
  scoped: number,
  viewOnly: number,
  denied: number,
  empty: number;
const service = (user: number) =>
  createAwbStatusReportService(db, () => loadAccessActor(db, user));
const awb = (suffix: string) => `${tag}-${suffix}`;
const awbs = (rows: { awbNo: string | null }[]) =>
  rows.map((row) => row.awbNo).sort();

async function transaction(
  suffix: string,
  data: Partial<Prisma.TransactionUncheckedCreateInput> = {},
) {
  const row = await db.transaction.create({
    data: {
      awbNo: awb(suffix),
      doNo: `DO-${suffix}`,
      transactionDate: new Date("2026-11-03T12:00:00Z"),
      originBranchId: a,
      destinationBranchId: b,
      senderName: "FAKE Sender",
      receiverName: "FAKE Receiver",
      koli: 2,
      kilo: "1.50",
      volume: "0.100",
      ...data,
    },
  });
  ids.transaction.push(row.id);
  return row.id;
}
async function manifest(
  suffix: string,
  date: string,
  data: Partial<Prisma.ManifestUncheckedCreateInput> = {},
) {
  const row = await db.manifest.create({
    data: {
      manifestNo: `${tag}-${suffix}`,
      manifestDate: new Date(date),
      branchId: a,
      ...data,
    },
  });
  ids.manifest.push(row.id);
  return row.id;
}
async function user(
  name: string,
  permissions: { resource: string; action: string }[],
  branches: number[],
) {
  const group = await db.userGroup.create({
    data: {
      name: `${tag}${name}`,
      status: "ACTIVE",
      permissions: { create: permissions },
    },
  });
  ids.group.push(group.id);
  const row = await db.user.create({
    data: {
      name: "FAKE awb status report user",
      email: `${randomUUID()}@example.invalid`,
      status: "ACTIVE",
      groupId: group.id,
      allowedBranches: {
        create: branches.map((branchId) => ({ branchId })),
      },
    },
  });
  ids.user.push(row.id);
  return row.id;
}

beforeAll(async () => {
  const company = await db.company.create({
    data: { name: tag, isDepositAgent: false, showPriceOnPrint: false },
  });
  ids.company.push(company.id);
  const office = await db.office.create({
    data: { companyId: company.id, name: tag, code: tag, status: "ACTIVE" },
  });
  ids.office.push(office.id);
  for (let i = 0; i < 3; i++)
    ids.branch.push(
      (
        await db.branch.create({
          data: {
            officeId: office.id,
            name: `FAKE ${tag} ${i}`,
            code: `${tag}${i}`,
            status: "ACTIVE",
          },
        })
      ).id,
    );
  [a, b, c] = ids.branch;
  admin = await user(
    "admin",
    [{ resource: "system_admin", action: "manage" }],
    [],
  );
  scoped = await user(
    "scoped",
    [
      { resource: "transaction_report", action: "view" },
      { resource: "transaction_report", action: "export" },
    ],
    [a, b],
  );
  viewOnly = await user(
    "view",
    [{ resource: "transaction_report", action: "view" }],
    [a, b],
  );
  denied = await user(
    "denied",
    [{ resource: "manifest_report", action: "view" }],
    [a, b],
  );
  empty = await user(
    "empty",
    [{ resource: "transaction_report", action: "view" }],
    [],
  );

  const never = await transaction("NEVER", { senderName: "=HYPERLINK(1)" });
  const active = await transaction("ACTIVE", { koli: 5 });
  const released = await transaction("RELEASED");
  await transaction("HIDDEN", { originBranchId: c, destinationBranchId: c });
  const deletedManifest = await transaction("DELMAN");
  await transaction("NOKILO", { kilo: null });
  const oldManifest = await transaction("OLDMAN");
  await transaction("SOFTDEL", { deletedAt: new Date() });

  const m1 = await manifest("M1", "2026-11-04T08:00:00Z");
  const m2 = await manifest("M2", "2026-11-04T08:00:00Z", {
    deletedAt: new Date(),
  });
  const m3 = await manifest("M3", "2026-10-20T08:00:00Z");
  await db.manifestItem.createMany({
    data: [
      { manifestId: m1, transactionId: active },
      { manifestId: m1, transactionId: released, releasedAt: new Date() },
      { manifestId: m2, transactionId: deletedManifest },
      { manifestId: m3, transactionId: oldManifest },
    ],
  });
  const sheet = await db.deliverySheet.create({
    data: {
      manifestId: m1,
      sheetNo: `${tag}-DRS`,
      deliveryDate: new Date("2026-11-05T00:00:00Z"),
    },
  });
  ids.sheet.push(sheet.id);
  const sheet3 = await db.deliverySheet.create({
    data: {
      manifestId: m3,
      sheetNo: `${tag}-DRS3`,
      deliveryDate: new Date("2026-11-06T00:00:00Z"),
    },
  });
  ids.sheet.push(sheet3.id);
  await db.deliverySheetItem.createMany({
    data: [
      // ACTIVE: first attempt has a recipient, later attempts do not.
      {
        deliverySheetId: sheet.id,
        transactionId: active,
        outcome: "Delivered",
        receivedBy: "FAKE R1",
        deliveredAt: new Date("2026-11-05T10:00:00Z"),
      },
      {
        deliverySheetId: sheet3.id,
        transactionId: active,
        outcome: "Failed",
        deliveredAt: new Date("2026-11-06T10:00:00Z"),
      },
      // NEVER: undated recipient must lose to a dated one (nulls last).
      {
        deliverySheetId: sheet.id,
        transactionId: never,
        receivedBy: "FAKE R-undated",
      },
      {
        deliverySheetId: sheet3.id,
        transactionId: never,
        receivedBy: "FAKE R-dated",
        deliveredAt: new Date("2026-11-06T09:00:00Z"),
      },
    ],
  });
});

afterAll(async () => {
  await db.deliverySheetItem.deleteMany({
    where: { deliverySheetId: { in: ids.sheet } },
  });
  await db.deliverySheet.deleteMany({ where: { id: { in: ids.sheet } } });
  await db.manifestItem.deleteMany({
    where: { manifestId: { in: ids.manifest } },
  });
  await db.manifest.deleteMany({ where: { id: { in: ids.manifest } } });
  await db.transaction.deleteMany({ where: { id: { in: ids.transaction } } });
  await db.user.deleteMany({ where: { id: { in: ids.user } } });
  await db.userGroup.deleteMany({ where: { id: { in: ids.group } } });
  await db.branch.deleteMany({ where: { id: { in: ids.branch } } });
  await db.office.deleteMany({ where: { id: { in: ids.office } } });
  await db.company.deleteMany({ where: { id: { in: ids.company } } });
  await db.$disconnect();
});

describe("LP-R10/R11/R21 guarded real sources", () => {
  it("authenticates, authorizes and rejects forged branches", async () => {
    await expect(
      createAwbStatusReportService(db, async () => null).read(
        "pending",
        period,
      ),
    ).rejects.toMatchObject({ status: 401 });
    for (const kind of ["pending", "manifested", "all-status"] as const)
      await expect(service(denied).read(kind, period)).rejects.toMatchObject({
        status: 403,
      });
    await expect(
      service(scoped).read("pending", { ...period, branchId: String(c) }),
    ).rejects.toMatchObject({ status: 403 });
    const none = await service(empty).read("all-status", period);
    expect(none).toMatchObject({ state: "ready", items: [], total: 0 });
    const invalid = await service(scoped).read("pending", {
      ...period,
      sortBy: "awbNo",
    });
    expect(invalid.state).toBe("invalid");
  });

  it("LP-R10 lists AWBs without an active manifest assignment", async () => {
    const result = await service(scoped).read("pending", period);
    expect(awbs(result.items)).toEqual(
      [awb("DELMAN"), awb("NEVER"), awb("NOKILO"), awb("RELEASED")].sort(),
    );
    expect(result.totals).toEqual({
      totalAwb: 4,
      totalKoli: 8,
      totalKilo: null,
      totalVolume: "0.4",
    });
    const all = await service(admin).read("pending", period);
    expect(awbs(all.items)).toContain(awb("HIDDEN"));
  });

  it("LP-R10 without dates covers every period, like legacy", async () => {
    await db.transaction.update({
      where: { id: ids.transaction[0] },
      data: { transactionDate: new Date("2025-01-10T00:00:00Z") },
    });
    try {
      const dated = await service(scoped).read("pending", period);
      expect(awbs(dated.items)).not.toContain(awb("NEVER"));
      const all = await service(scoped).read("pending", {
        search: tag,
        pageSize: "100",
      });
      expect(all.allDates).toBe(true);
      expect(awbs(all.items)).toContain(awb("NEVER"));
      await expect(
        service(scoped).read("manifested", { search: tag }),
      ).resolves.toMatchObject({ state: "initial" });
    } finally {
      await db.transaction.update({
        where: { id: ids.transaction[0] },
        data: { transactionDate: new Date("2026-11-03T12:00:00Z") },
      });
    }
  });

  it("LP-R21 filters by stored status and lists scoped status options", async () => {
    await db.transaction.update({
      where: { id: ids.transaction[1] },
      data: { status: `${tag.slice(0, 8)}X` },
    });
    const result = await service(scoped).read("all-status", {
      ...period,
      status: `${tag.slice(0, 8)}X`,
    });
    expect(awbs(result.items)).toEqual([awb("ACTIVE")]);
    expect(result.statuses).toContain(`${tag.slice(0, 8)}X`);
    expect(
      (await service(scoped).read("pending", { ...period, status: "Open" }))
        .state,
    ).toBe("invalid");
  });

  it("LP-R11 lists only active assignments by manifest date", async () => {
    const result = await service(scoped).read("manifested", period);
    expect(result.items).toEqual([
      expect.objectContaining({
        awbNo: awb("ACTIVE"),
        doNo: "DO-ACTIVE",
        manifestNo: `${tag}-M1`,
        manifestDate: "2026-11-04T08:00:00.000Z",
        koli: 5,
        kilo: "1.5",
      }),
    ]);
    expect(result.totals?.totalKoli).toBe(5);
    const october = await service(scoped).read("manifested", {
      ...period,
      startDate: "2026-10-15",
      endDate: "2026-10-31",
    });
    expect(awbs(october.items)).toEqual([awb("OLDMAN")]);
  });

  it("LP-R21 uses stored status, active manifest and latest recorded recipient", async () => {
    const result = await service(scoped).read("all-status", period);
    expect(result.kind).toBe("all-status");
    if (result.kind !== "all-status") return;
    const byAwb = new Map(result.items.map((row) => [row.awbNo, row]));
    expect([...byAwb.keys()].sort()).toEqual(
      ["ACTIVE", "DELMAN", "NEVER", "NOKILO", "OLDMAN", "RELEASED"]
        .map(awb)
        .sort(),
    );
    expect(byAwb.get(awb("ACTIVE"))).toMatchObject({
      receivedBy: "FAKE R1",
      deliveredAt: "2026-11-05T10:00:00.000Z",
      manifestNo: `${tag}-M1`,
    });
    expect(byAwb.get(awb("NEVER"))).toMatchObject({
      receivedBy: "FAKE R-dated",
      manifestNo: null,
    });
    expect(byAwb.get(awb("RELEASED"))?.manifestNo).toBeNull();
    expect(byAwb.get(awb("DELMAN"))?.manifestNo).toBeNull();
    expect(byAwb.get(awb("OLDMAN"))?.manifestNo).toBe(`${tag}-M3`);
  });

  it("exports the same rows with export permission and formula protection", async () => {
    await expect(
      service(viewOnly).export("all-status", period),
    ).rejects.toMatchObject({ status: 403 });
    const csv = await service(scoped).export("pending", period);
    const lines = csv.trimEnd().split("\r\n");
    expect(lines[0]).toBe(
      '"AWB No.","DO No.","Tanggal transaksi (UTC)","Tujuan","Koli","Berat (kg)","Volume"',
    );
    expect(lines).toHaveLength(5);
    const status = await service(scoped).export("all-status", period);
    expect(status).toContain(`"'=HYPERLINK(1)"`);
    expect(status).not.toContain(`"=HYPERLINK(1)"`);
  });
});
