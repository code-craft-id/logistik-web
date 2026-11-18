import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AccessActor } from "../../src/features/identity/permissions";
import { createOperationalReportService } from "../../src/features/reports/operational/server/service";
import type { PrismaClient } from "../../src/lib/db/generated/client";

const period = { startDate: "2026-11-01", endDate: "2026-11-15" };
let current: AccessActor | null;
const db = {
  user: { findUnique: vi.fn() },
  branch: { findMany: vi.fn() },
  manifest: { findMany: vi.fn(), count: vi.fn() },
  manifestItem: { findMany: vi.fn() },
  transaction: { count: vi.fn(), groupBy: vi.fn(), findMany: vi.fn() },
  deliverySheet: { findMany: vi.fn(), count: vi.fn() },
  deliverySheetItem: { findMany: vi.fn(), count: vi.fn() },
  $transaction: vi.fn(),
  $queryRaw: vi.fn().mockResolvedValue([]),
};
const read = () =>
  createOperationalReportService(
    db as unknown as PrismaClient,
    async () => current,
  );
beforeEach(() => {
  vi.resetAllMocks();
  current = {
    id: 1,
    status: "ACTIVE",
    branchIds: [10],
    group: {
      id: 1,
      name: "FAKE",
      status: "ACTIVE",
      deletedAt: null,
      permissions: [
        "manifest_report",
        "delivery_report",
        "dashboard_report",
      ].map((resource) => ({ resource, action: "view" })),
    },
  };
  db.user.findUnique.mockImplementation(
    async () =>
      current && {
        ...current,
        allowedBranches: current.branchIds.map((branchId) => ({ branchId })),
      },
  );
  db.branch.findMany.mockResolvedValue([{ id: 10, name: "FAKE Branch" }]);
  db.$transaction.mockImplementation(async (work) => work(db));
  db.manifestItem.findMany.mockResolvedValue([]);
  db.manifest.findMany.mockResolvedValue([
    {
      id: 5,
      manifestNo: "FAKE-M",
      manifestDate: new Date("2026-11-02T00:00:00Z"),
      branch: { name: "FAKE" },
      originBranchId: null,
      destinationBranchId: null,
      type: "Transit",
      vehicle: null,
      courier: null,
      status: "Draft",
      _count: { items: 0 },
      biaya: "private",
    },
  ]);
  for (const model of [
    db.manifest,
    db.transaction,
    db.deliverySheet,
    db.deliverySheetItem,
  ])
    model.count.mockResolvedValue(0);
});
describe("operational report boundaries", () => {
  it("authenticates independently and reloads fresh grants", async () => {
    current = null;
    await expect(read().read("manifest", period)).rejects.toMatchObject({
      status: 401,
    });
    current = {
      id: 1,
      status: "ACTIVE",
      branchIds: [10],
      group: {
        id: 1,
        name: "FAKE",
        status: "ACTIVE",
        deletedAt: null,
        permissions: [{ resource: "manifest", action: "view" }],
      },
    };
    await expect(read().read("manifest", period)).rejects.toMatchObject({
      status: 403,
    });
  });
  it("uses one snapshot with identical owner-scoped rows/count and exact DTO", async () => {
    const result = await read().read("manifest", period);
    expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "RepeatableRead",
    });
    const args = db.manifest.findMany.mock.calls[0][0];
    expect(args.where).toEqual(db.manifest.count.mock.calls[0][0].where);
    expect(args.where.AND).toContainEqual({ branchId: { in: [10] } });
    expect(args.where).not.toHaveProperty("originBranchId");
    expect(result.items).toEqual([
      {
        id: 5,
        manifestNo: "FAKE-M",
        date: "2026-11-02T00:00:00.000Z",
        branch: "FAKE",
        originBranch: null,
        destinationBranch: null,
        type: "Transit",
        vehicle: null,
        courier: null,
        status: "Draft",
        assignedTransactions: 0,
        totalKoli: 0,
        totalKilo: "0",
        totalVolume: "0",
      },
    ]);
    expect(args.select._count.select.items.where).toMatchObject({
      deletedAt: null,
      releasedAt: null,
      transaction: { is: { deletedAt: null } },
    });
  });
  it("resolves only stored page references without adding them to branch options or guessing missing labels", async () => {
    const source = (await db.manifest.findMany())[0];
    db.manifest.findMany.mockResolvedValue([
      { ...source, originBranchId: 10, destinationBranchId: 999 },
    ]);
    const result = await read().read("manifest", period);
    expect(result.items[0]).toMatchObject({
      originBranch: "FAKE Branch",
      destinationBranch: null,
    });
    expect(result.branches).toEqual([{ id: 10, name: "FAKE Branch" }]);
    expect(db.branch.findMany).toHaveBeenCalledWith({
      where: { id: { in: [10, 999] } },
      select: { id: true, name: true },
    });
  });
  it("bounds quantities to the displayed manifests and the same scoped active items as the count", async () => {
    await read().read("manifest", period);
    const args = db.manifestItem.findMany.mock.calls[0][0];
    expect(args.where).toEqual({
      ...db.manifest.findMany.mock.calls[0][0].select._count.select.items.where,
      manifestId: { in: [5] },
    });
    expect(args.take).toBe(10001);
    expect(args.select).toEqual({
      manifestId: true,
      transaction: { select: { koli: true, kilo: true, volume: true } },
    });
    db.manifest.findMany.mockResolvedValue([]);
    db.manifestItem.findMany.mockClear();
    expect((await read().read("manifest", period)).items).toEqual([]);
    expect(db.manifestItem.findMany).not.toHaveBeenCalled();
  });
  it("validates branch options even for admins and does not run initial source queries", async () => {
    expect((await read().read("manifest", {})).state).toBe("initial");
    expect(db.manifest.findMany).not.toHaveBeenCalled();
    if (!current?.group) throw new Error("fixture");
    current.group.permissions = [
      { resource: "system_admin", action: "manage" },
    ];
    await expect(
      read().read("manifest", { ...period, branchId: "999" }),
    ).rejects.toMatchObject({ status: 403 });
  });
  it("loads raw dashboard counts without metadata-dependent report links", async () => {
    if (!current?.group) throw new Error("fixture");
    current.group.permissions = [
      { resource: "dashboard_report", action: "view" },
    ];
    db.transaction.count.mockResolvedValue(4);
    db.manifest.count.mockResolvedValue(3);
    db.deliverySheet.count.mockResolvedValue(2);
    db.deliverySheetItem.count.mockResolvedValue(1);
    db.$queryRaw.mockResolvedValue([]);
    db.transaction.groupBy.mockResolvedValue([
      { status: "Open", _count: { _all: 4 } },
    ]);
    const result = await read().read("dashboard", period);
    expect(result.kind).toBe("dashboard");
    if (result.kind !== "dashboard") throw new Error("wrong kind");
    expect(result.counts).toEqual({
      transactions: 4,
      manifests: 3,
      sheets: 2,
      items: 1,
    });
    expect(result.links).toEqual({
      manifest: false,
      delivery: false,
      transaction: false,
    });
    // Without transaction or invoice rights, no detail rows or balances are read.
    expect(result.insights).toMatchObject({
      actions: [],
      statuses: [{ status: "Open", count: 4 }],
      daily: expect.arrayContaining([{ date: period.startDate, count: 0 }]),
      recent: null,
      invoices: null,
    });
    expect(db.transaction.findMany).not.toHaveBeenCalled();
  });
  it("exposes vendor readiness only, without any inferred data query", async () => {
    const result = await read().read("vendor", {});
    expect(result).toMatchObject({
      kind: "vendor",
      state: "unavailable",
      items: [],
    });
    expect(db.manifest.findMany).not.toHaveBeenCalled();
  });
});
