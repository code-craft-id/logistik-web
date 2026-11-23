import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AccessActor } from "../../src/features/identity/permissions";
import { PrismaClient } from "../../src/lib/db/generated/client";
import { testDatabaseUrl } from "../support/test-database-url";

/**
 * D-35 simplified provider workflows exercised by several real users with
 * different groups and branches inside ONE company (two branches):
 * admin, staff A, staff B, read-only A, no-access A and ticket support A.
 */
const url = testDatabaseUrl(
  process.env.TEST_DATABASE_URL,
  process.env.DATABASE_URL,
);
process.env.DATABASE_URL = url;
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});
const tag = `D35${randomUUID().slice(0, 8)}`;

type Grant = readonly [string, readonly string[]];
const STAFF: Grant[] = [
  ["delivery", ["view", "create", "update"]],
  ["vendor_process", ["view", "create", "delete"]],
  ["manifest_report", ["view"]],
  ["delivery_report", ["view"]],
  ["ticket", ["view", "create"]],
  ["transaction", ["view", "create"]],
];
const PROFILES = {
  admin: { grants: [["system_admin", ["manage"]]] as Grant[], branches: "ab" },
  staffA: { grants: STAFF, branches: "a" },
  staffB: { grants: STAFF, branches: "b" },
  viewerA: {
    grants: [
      ["delivery", ["view"]],
      ["vendor_process", ["view"]],
      ["ticket", ["view"]],
    ] as Grant[],
    branches: "a",
  },
  noneA: { grants: [] as Grant[], branches: "a" },
  supportA: {
    grants: [["ticket", ["view", "create", "manage"]]] as Grant[],
    branches: "a",
  },
} as const;
type Who = keyof typeof PROFILES;

const ids = {
  company: 0,
  office: 0,
  a: 0,
  b: 0,
  courierA: 0,
  courierB: 0,
  vendor: 0,
  groups: [] as number[],
  users: {} as Record<Who, number>,
  tx: [] as number[],
  manifests: [] as number[],
};

type Mods = {
  access: typeof import("../../src/features/identity/server/access");
  drs: typeof import("../../src/features/shipments/server/delivery-sheets");
  outcome: typeof import("../../src/features/shipments/server/manifests-service");
  vendor: typeof import("../../src/features/modul/server/vendor-processes");
  ticket: typeof import("../../src/features/ticketing/server/service");
  recap: typeof import("../../src/features/reports/manifest-recap/server/manifest-recap");
  courier: typeof import("../../src/features/reports/courier-detail/server/courier-detail");
  pricing: typeof import("../../src/features/bookings/server/service");
};
let m: Mods;
const as = async (who: Who): Promise<AccessActor> => {
  const actor = await m.access.loadAccessActor(db, ids.users[who]);
  if (!actor) throw new Error(`fixture actor ${who} missing`);
  return actor;
};
const tickets = (who: Who) =>
  m.ticket.createTicketService(db, () =>
    m.access.loadAccessActor(db, ids.users[who]),
  );
const today = new Date().toISOString().slice(0, 10);
let seq = 0;
const awb = async (
  origin: "a" | "b",
  destination: "a" | "b",
  status = "In Transit",
) => {
  const row = await db.transaction.create({
    data: {
      awbNo: `${tag}-${++seq}`,
      originBranchId: ids[origin],
      destinationBranchId: ids[destination],
      status,
      koli: 2,
      kilo: "3.5",
      volume: "1",
      biaya: "50000",
    },
  });
  ids.tx.push(row.id);
  return row;
};
const code = (e: unknown) =>
  e && typeof e === "object" && "code" in e ? e.code : (e as Error)?.message;

beforeAll(async () => {
  m = {
    access: await import("../../src/features/identity/server/access"),
    drs: await import("../../src/features/shipments/server/delivery-sheets"),
    outcome: await import(
      "../../src/features/shipments/server/manifests-service"
    ),
    vendor: await import("../../src/features/modul/server/vendor-processes"),
    ticket: await import("../../src/features/ticketing/server/service"),
    recap: await import(
      "../../src/features/reports/manifest-recap/server/manifest-recap"
    ),
    courier: await import(
      "../../src/features/reports/courier-detail/server/courier-detail"
    ),
    pricing: await import("../../src/features/bookings/server/service"),
  };
  // Exactly one company with one office and two branches.
  ids.company = (
    await db.company.create({
      data: { name: tag, isDepositAgent: false, showPriceOnPrint: true },
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
          name: `${tag} ${key.toUpperCase()}`,
          code: `${tag}${key}`,
          status: "ACTIVE",
        },
      })
    ).id;
  for (const key of ["A", "B"] as const)
    ids[`courier${key}`] = (
      await db.courier.create({
        data: {
          name: `FAKE ${tag} kurir ${key}`,
          address: "-",
          nationalIdNumber: "0",
          phone: "0",
          branchId: key === "A" ? ids.a : ids.b,
        },
      })
    ).id;
  ids.vendor = (
    await db.vendor.create({
      data: {
        name: `${tag} vendor`,
        address1: "-",
        address2: "-",
        city: "-",
        postalCode: "-",
        phone: "-",
        fax: "-",
        email: "-",
        contactName: "-",
        branch: "-",
      },
    })
  ).id;
  for (const [who, profile] of Object.entries(PROFILES) as [
    Who,
    (typeof PROFILES)[Who],
  ][]) {
    const group = await db.userGroup.create({
      data: {
        name: `${tag} ${who}`,
        permissions: {
          create: profile.grants.flatMap(([resource, actions]) =>
            actions.map((action) => ({ resource, action })),
          ),
        },
      },
    });
    ids.groups.push(group.id);
    ids.users[who] = (
      await db.user.create({
        data: {
          name: `FAKE ${who}`,
          email: `${randomUUID()}@example.invalid`,
          status: "ACTIVE",
          groupId: group.id,
          allowedBranches: {
            create: [...profile.branches].map((k) => ({
              branchId: ids[k as "a" | "b"],
            })),
          },
        },
      })
    ).id;
  }
});

afterAll(async () => {
  const users = Object.values(ids.users);
  await db.deliverySheetItem.deleteMany({
    where: { transactionId: { in: ids.tx } },
  });
  await db.deliverySheet.deleteMany({
    where: { branchId: { in: [ids.a, ids.b] } },
  });
  await db.vendorProcess.deleteMany({
    where: { transactionId: { in: ids.tx } },
  });
  await db.transactionStatusHistory.deleteMany({
    where: { transactionId: { in: ids.tx } },
  });
  await db.manifestItem.deleteMany({
    where: { manifestId: { in: ids.manifests } },
  });
  await db.manifest.deleteMany({ where: { id: { in: ids.manifests } } });
  await db.transaction.deleteMany({ where: { id: { in: ids.tx } } });
  await db.ticket.deleteMany({ where: { createdById: { in: users } } });
  await db.userAllowedBranch.deleteMany({ where: { userId: { in: users } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.userGroup.deleteMany({ where: { id: { in: ids.groups } } });
  await db.courier.deleteMany({
    where: { id: { in: [ids.courierA, ids.courierB] } },
  });
  await db.vendor.deleteMany({ where: { id: ids.vendor } });
  await db.branch.deleteMany({ where: { id: { in: [ids.a, ids.b] } } });
  await db.office.deleteMany({ where: { id: ids.office } });
  await db.company.deleteMany({ where: { id: ids.company } });
  await db.$disconnect();
});

describe("Entry AWB COD and insurance (owner decision: fees join Grand Total)", () => {
  it("adds Biaya Asuransi and Biaya COD to Total and Grand Total; values only stored", () => {
    const priced = m.pricing.priceAwb({
      pricingType: "KG",
      kilo: "10",
      pricePerKg: "1000",
      otherFee: "500",
      insuranceFee: "2000",
      codFee: "1500",
      discountPercent: "10",
      ppnPercent: "11",
    });
    // 10 x 1000 + 500 + 2000 + 1500 = 14000; -10% = 12600; +11% = 13986.
    expect(priced.totalCost).toBe("14000.00");
    expect(priced.biaya).toBe("13986.00");
  });
});

describe("Kurir Kota (standalone DRS) across users", () => {
  let sheetA = 0;
  it("lets staff A create a DRS for branch A with an automatic number", async () => {
    const created = await m.drs.createStandaloneDeliverySheet(
      await as("staffA"),
      {
        branchId: String(ids.a),
        deliveryDate: today,
        courierId: String(ids.courierA),
        remarks: "FAKE",
      },
    );
    sheetA = created.id;
    const sheet = await db.deliverySheet.findUniqueOrThrow({
      where: { id: sheetA },
    });
    expect(sheet.manifestId).toBeNull();
    expect(sheet.branchId).toBe(ids.a);
    expect(sheet.sheetNo).toMatch(/^DRS-/);
  });
  it("refuses another branch, another branch's courier, read-only and no-access users", async () => {
    const input = {
      branchId: String(ids.b),
      deliveryDate: today,
      courierId: String(ids.courierB),
    };
    await expect(
      m.drs.createStandaloneDeliverySheet(await as("staffA"), input),
    ).rejects.toMatchObject({ code: "FORBIDDEN_BRANCH" });
    await expect(
      m.drs.createStandaloneDeliverySheet(await as("staffA"), {
        ...input,
        branchId: String(ids.a),
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    for (const who of ["viewerA", "noneA"] as const)
      await expect(
        m.drs.createStandaloneDeliverySheet(await as(who), {
          ...input,
          branchId: String(ids.a),
          courierId: String(ids.courierA),
        }),
      ).rejects.toBeTruthy();
    await expect(
      m.drs.listStandaloneDeliverySheets(await as("noneA"), {}),
    ).rejects.toBeTruthy();
  });
  it("adds visible AWBs once, blocks double DRS, delivered AWBs and other branches", async () => {
    const one = await awb("a", "a");
    await m.drs.addAwbToDeliverySheet(await as("staffA"), {
      deliverySheetId: String(sheetA),
      awbNo: one.awbNo,
    });
    await expect(
      m.drs.addAwbToDeliverySheet(await as("staffA"), {
        deliverySheetId: String(sheetA),
        awbNo: one.awbNo,
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    const second = await m.drs.createStandaloneDeliverySheet(
      await as("staffA"),
      {
        branchId: String(ids.a),
        deliveryDate: today,
        courierId: String(ids.courierA),
      },
    );
    await expect(
      m.drs.addAwbToDeliverySheet(await as("staffA"), {
        deliverySheetId: String(second.id),
        awbNo: one.awbNo,
      }),
    ).rejects.toThrow(/menunggu hasil antar/);
    const delivered = await awb("a", "a", "Delivered");
    await expect(
      m.drs.addAwbToDeliverySheet(await as("staffA"), {
        deliverySheetId: String(sheetA),
        awbNo: delivered.awbNo,
      }),
    ).rejects.toThrow(/Delivered/);
    // Staff B may not write to branch A's DRS, nor see branch A-only AWBs.
    await expect(
      m.drs.addAwbToDeliverySheet(await as("staffB"), {
        deliverySheetId: String(sheetA),
        awbNo: one.awbNo,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN_BRANCH" });
    const onlyA = await awb("a", "a");
    const sheetB = await m.drs.createStandaloneDeliverySheet(
      await as("staffB"),
      {
        branchId: String(ids.b),
        deliveryDate: today,
        courierId: String(ids.courierB),
      },
    );
    await expect(
      m.drs.addAwbToDeliverySheet(await as("staffB"), {
        deliverySheetId: String(sheetB.id),
        awbNo: onlyA.awbNo,
      }),
    ).rejects.toThrow(/tidak ditemukan/);
  });
  it("scopes lists and details per branch; admin sees both branches", async () => {
    const listA = await m.drs.listStandaloneDeliverySheets(
      await as("staffA"),
      {},
    );
    const listB = await m.drs.listStandaloneDeliverySheets(
      await as("staffB"),
      {},
    );
    const listAdmin = await m.drs.listStandaloneDeliverySheets(
      await as("admin"),
      {},
    );
    expect(listA.rows.every((r) => r.branch === `${tag} A`)).toBe(true);
    expect(listB.rows.every((r) => r.branch === `${tag} B`)).toBe(true);
    expect(listA.rows.some((r) => r.id === sheetA)).toBe(true);
    expect(listB.rows.some((r) => r.id === sheetA)).toBe(false);
    expect(listAdmin.rows.some((r) => r.id === sheetA)).toBe(true);
    expect(
      await m.drs.getStandaloneDeliverySheet(await as("staffB"), sheetA),
    ).toBeNull();
    expect(
      (await m.drs.getStandaloneDeliverySheet(await as("viewerA"), sheetA))
        ?.items.length,
    ).toBe(1);
  });
  it("records outcomes for branch A only, marks the AWB Delivered and then locks the line", async () => {
    const sheet = await m.drs.getStandaloneDeliverySheet(
      await as("admin"),
      sheetA,
    );
    const line = sheet?.items[0];
    if (!line) throw new Error("missing line");
    await expect(
      m.outcome.recordDeliveryOutcome(
        {
          deliverySheetId: sheetA,
          transactionId: line.transactionId,
          outcome: "DELIVERED",
          receivedBy: "FAKE",
        },
        await as("staffB"),
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN_BRANCH" });
    await m.outcome.recordDeliveryOutcome(
      {
        deliverySheetId: sheetA,
        transactionId: line.transactionId,
        outcome: "DELIVERED",
        receivedBy: "FAKE",
      },
      await as("staffA"),
    );
    expect(
      (
        await db.transaction.findUniqueOrThrow({
          where: { id: line.transactionId },
        })
      ).status,
    ).toBe("Delivered");
    await expect(
      m.drs.removeAwbFromDeliverySheet(await as("staffA"), {
        deliverySheetId: String(sheetA),
        transactionId: String(line.transactionId),
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(
      m.drs.deleteStandaloneDeliverySheet(await as("staffA"), {
        deliverySheetId: String(sheetA),
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    // An AWB never on a manifest DRS cannot be recorded on a sheet it is not on.
    const stray = await awb("a", "a");
    await expect(
      m.outcome.recordDeliveryOutcome(
        {
          deliverySheetId: sheetA,
          transactionId: stray.id,
          outcome: "DELIVERED",
        },
        await as("staffA"),
      ),
    ).rejects.toThrow(/DELIVERY_SHEET_ITEM_NOT_FOUND/);
  });
  it("shows the lines in Laporan Detail Kurir per branch with Sukses / Pending totals", async () => {
    const a = await m.courier.courierDetailReport(await as("staffA"), {});
    const b = await m.courier.courierDetailReport(await as("staffB"), {});
    expect(a.totals.success).toBeGreaterThanOrEqual(1);
    expect(a.rows.every((r) => r.sheetNo)).toBe(true);
    expect(
      a.rows.some(
        (r) => r.status === "Sukses" && r.courier?.includes("kurir A"),
      ),
    ).toBe(true);
    expect(b.rows.some((r) => r.courier?.includes("kurir A"))).toBe(false);
    // Asking for another branch's data returns nothing instead of leaking it.
    const leak = await m.courier.courierDetailReport(await as("staffB"), {
      branchId: String(ids.a),
    });
    expect(leak.rows).toHaveLength(0);
    await expect(
      m.courier.courierDetailReport(await as("viewerA"), {}),
    ).rejects.toBeTruthy();
  });
});

describe("Proses Vendor across users", () => {
  it("creates once per AWB, blocks other branches, read-only and no-access users", async () => {
    const shared = await awb("a", "b");
    const created = await m.vendor.createVendorProcess(await as("staffA"), {
      awbNo: shared.awbNo,
      vendorId: String(ids.vendor),
      vendorAwbNo: "FAKE-V-1",
      processDate: today,
    });
    expect(
      (await db.vendorProcess.findUniqueOrThrow({ where: { id: created.id } }))
        .branchId,
    ).toBe(ids.a);
    await expect(
      m.vendor.createVendorProcess(await as("staffB"), {
        awbNo: shared.awbNo,
        vendorId: String(ids.vendor),
        processDate: today,
      }),
    ).rejects.toThrow(/sudah diproses/);
    await expect(
      m.vendor.deleteVendorProcess(await as("staffB"), {
        id: String(created.id),
      }),
    ).rejects.toThrow(/cabang lain/);
    for (const who of ["viewerA", "noneA"] as const)
      await expect(
        m.vendor.createVendorProcess(await as(who), {
          awbNo: shared.awbNo,
          vendorId: String(ids.vendor),
          processDate: today,
        }),
      ).rejects.toBeTruthy();
    const listA = await m.vendor.listVendorProcesses(await as("viewerA"), {});
    const listB = await m.vendor.listVendorProcesses(await as("staffB"), {});
    expect(listA.rows.some((r) => r.id === created.id)).toBe(true);
    expect(listB.rows.some((r) => r.id === created.id)).toBe(false);
    await m.vendor.deleteVendorProcess(await as("staffA"), {
      id: String(created.id),
    });
    // After deletion the AWB can be processed again (destination B this time).
    const again = await m.vendor.createVendorProcess(await as("staffB"), {
      awbNo: shared.awbNo,
      vendorId: String(ids.vendor),
      processDate: today,
    });
    expect(
      (await db.vendorProcess.findUniqueOrThrow({ where: { id: again.id } }))
        .branchId,
    ).toBe(ids.b);
  });
});

describe("Ticket lifecycle and Persetujuan Tiketing across users", () => {
  it("support moves the status, only the creator approves or asks a revision", async () => {
    const created = await tickets("staffA").create({
      branchId: ids.a,
      subject: `${tag} ticket`,
      menuName: "Kurir Kota",
      relatedPageUrl: "/delivery-sheets",
      priority: "Normal",
      idempotencyKey: randomUUID(),
    });
    expect(created.status).toBe("Open");
    // Support A sees branch A tickets; staff B does not.
    expect(await tickets("supportA").detail(created.id)).not.toBeNull();
    expect(await tickets("staffB").detail(created.id)).toBeNull();
    // Only ticket: manage may change status.
    await expect(
      tickets("staffA").setStatus({ id: created.id, status: "Finish" }),
    ).rejects.toBeTruthy();
    // The creator cannot approve before Finish.
    await expect(
      tickets("staffA").decide({ id: created.id, decision: "Approved" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    await tickets("supportA").setStatus({ id: created.id, status: "Finish" });
    const waiting = await tickets("staffA").list({ tab: "approval" });
    expect(waiting.items.map((t) => t.id)).toContain(created.id);
    // Support is not the creator and cannot approve; revision needs a note.
    await expect(
      tickets("supportA").decide({ id: created.id, decision: "Approved" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(
      tickets("staffA").decide({ id: created.id, decision: "Revision" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    await tickets("staffA").decide({
      id: created.id,
      decision: "Revision",
      note: "FAKE masih salah",
    });
    expect(await tickets("staffA").detail(created.id)).toMatchObject({
      status: "Open",
      approval: "Revision",
    });
    await tickets("supportA").setStatus({ id: created.id, status: "Finish" });
    await tickets("staffA").decide({ id: created.id, decision: "Approved" });
    expect(await tickets("admin").detail(created.id)).toMatchObject({
      status: "Finish",
      approval: "Approved",
      approvedBy: "FAKE staffA",
    });
    // An approved ticket is final.
    await expect(
      tickets("supportA").setStatus({ id: created.id, status: "Open" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });
});

describe("Rekap Manifest scope", () => {
  it("limits rows to the user's branches and refuses another branch", async () => {
    const now = new Date();
    for (const key of ["a", "b"] as const) {
      const manifest = await db.manifest.create({
        data: {
          manifestNo: `${tag}-M-${key}`,
          branchId: ids[key],
          originBranchId: ids[key],
          destinationBranchId: ids[key === "a" ? "b" : "a"],
          manifestDate: now,
        },
      });
      ids.manifests.push(manifest.id);
      const item = await awb(key, key === "a" ? "b" : "a");
      await db.manifestItem.create({
        data: { manifestId: manifest.id, transactionId: item.id },
      });
    }
    const month = {
      month: String(now.getUTCMonth() + 1),
      year: String(now.getUTCFullYear()),
    };
    const a = await m.recap.manifestRecap(await as("staffA"), month);
    expect(a.rows.map((r) => r.manifestNo)).toContain(`${tag}-M-a`);
    expect(a.rows.map((r) => r.manifestNo)).not.toContain(`${tag}-M-b`);
    expect(a.rows.find((r) => r.manifestNo === `${tag}-M-a`)).toMatchObject({
      awb: 1,
      koli: 2,
      kilo: 3.5,
    });
    await expect(
      m.recap.manifestRecap(await as("staffA"), {
        ...month,
        branchId: String(ids.b),
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN_BRANCH" });
    const admin = await m.recap.manifestRecap(await as("admin"), month);
    expect(admin.rows.map((r) => r.manifestNo)).toEqual(
      expect.arrayContaining([`${tag}-M-a`, `${tag}-M-b`]),
    );
    await expect(
      m.recap.manifestRecap(await as("noneA"), month),
    ).rejects.toBeTruthy();
    expect(code(null)).toBeUndefined();
  });
});
