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
  transaction: { count: vi.fn() },
  deliverySheet: { findMany: vi.fn(), count: vi.fn() },
  deliverySheetItem: { findMany: vi.fn(), count: vi.fn() },
  $transaction: vi.fn(),
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
  db.manifest.findMany.mockResolvedValue([
    {
      id: 5,
      manifestNo: "FAKE-M",
      manifestDate: new Date("2026-11-02T00:00:00Z"),
      branch: { name: "FAKE" },
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
        type: "Transit",
        vehicle: null,
        courier: null,
        status: "Draft",
        assignedTransactions: 0,
      },
    ]);
    expect(args.select._count.select.items.where).toMatchObject({
      deletedAt: null,
      releasedAt: null,
      transaction: { is: { deletedAt: null } },
    });
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
