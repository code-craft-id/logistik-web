import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AccessActor } from "../../src/features/identity/permissions";
import { createTransactionReportService } from "../../src/features/reports/transaction-details/server/service";
import type { PrismaClient } from "../../src/lib/db/generated/client";

const period = { startDate: "2026-11-01", endDate: "2026-11-15" };
let current: AccessActor | null;
const actor = (): AccessActor => ({
  id: 1,
  status: "ACTIVE",
  branchIds: [10, 20],
  group: {
    id: 1,
    name: "FAKE",
    status: "ACTIVE",
    deletedAt: null,
    permissions: [{ resource: "transaction_report", action: "view" }],
  },
});
function fixture() {
  if (!current?.group) throw new Error("Missing fixture");
  return current as AccessActor & { group: NonNullable<AccessActor["group"]> };
}
const row = {
  id: 8,
  awbNo: "FAKE-AWB",
  transactionDate: new Date("2026-11-02T00:00:00Z"),
  originBranch: { name: "FAKE A" },
  destinationBranch: null,
  senderName: "FAKE sender",
  receiverName: null,
  koli: 0,
  kilo: { toString: () => "12.34" },
  status: "Cancelled",
  biaya: "secret",
  idempotencyKey: "private",
};
const db = {
  user: { findUnique: vi.fn() },
  branch: { findMany: vi.fn() },
  transaction: { findMany: vi.fn(), count: vi.fn() },
  $transaction: vi.fn(),
};
const service = () =>
  createTransactionReportService(
    db as unknown as PrismaClient,
    async () => current,
  );
beforeEach(() => {
  vi.resetAllMocks();
  current = actor();
  db.user.findUnique.mockImplementation(
    async () =>
      current && {
        ...current,
        allowedBranches: current.branchIds.map((branchId) => ({ branchId })),
      },
  );
  db.branch.findMany.mockResolvedValue([
    { id: 10, name: "FAKE A" },
    { id: 20, name: "FAKE B" },
  ]);
  db.transaction.findMany.mockResolvedValue([row]);
  db.transaction.count.mockResolvedValue(1);
  db.$transaction.mockImplementation(async (work) => work(db));
});
describe("transaction report fresh scope and exact projection", () => {
  it("uses one repeatable snapshot and identical scoped predicates for rows/count", async () => {
    const result = await service().read(period);
    expect(result.state).toBe("ready");
    expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "RepeatableRead",
    });
    expect(db.transaction.findMany.mock.calls[0][0].where).toEqual(
      db.transaction.count.mock.calls[0][0].where,
    );
    expect(db.transaction.findMany.mock.calls[0][0]).toMatchObject({
      where: {
        deletedAt: null,
        AND: expect.arrayContaining([
          {
            OR: [
              { originBranchId: { in: [10, 20] } },
              { destinationBranchId: { in: [10, 20] } },
            ],
          },
        ]),
      },
      orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
      skip: 0,
      take: 20,
    });
    expect(result.items).toEqual([
      {
        id: 8,
        awbNo: "FAKE-AWB",
        transactionDate: "2026-11-02T00:00:00.000Z",
        originBranch: "FAKE A",
        destinationBranch: null,
        senderName: "FAKE sender",
        receiverName: null,
        koli: 0,
        kilo: "12.34",
        status: "Cancelled",
      },
    ]);
    expect(JSON.stringify(result.items)).not.toMatch(
      /secret|private|idempotencyKey|biaya/,
    );
  });
  it("does not query transactions for initial or malformed filters", async () => {
    expect((await service().read({})).state).toBe("initial");
    expect((await service().read({ ...period, status: "Paid" })).state).toBe(
      "invalid",
    );
    expect(db.transaction.findMany).not.toHaveBeenCalled();
    expect(db.transaction.count).not.toHaveBeenCalled();
  });
  it("authenticates even initial requests and rejects transaction-only grants", async () => {
    current = null;
    await expect(service().read({})).rejects.toHaveProperty("status", 401);
    current = actor();
    fixture().group.permissions = [{ resource: "transaction", action: "view" }];
    await expect(service().read(period)).rejects.toHaveProperty("status", 403);
  });
  it("reloads fresh grants rather than trusting a previously resolved actor", async () => {
    const old = actor();
    db.user.findUnique.mockResolvedValue({
      ...old,
      group: { ...old.group, permissions: [] },
      allowedBranches: [],
    });
    await expect(service().read(period)).rejects.toHaveProperty("status", 403);
  });
  it("keeps empty scope empty and denies forged filters before source reads", async () => {
    fixture().branchIds = [];
    db.branch.findMany.mockResolvedValue([]);
    const result = await service().read(period);
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(db.transaction.findMany).not.toHaveBeenCalled();
    await expect(
      service().read({ ...period, branchId: "30" }),
    ).rejects.toHaveProperty("status", 403);
  });
  it("checks selected branch against options even for admin, preserving global reads without a filter", async () => {
    fixture().group.permissions = [
      { resource: "system_admin", action: "manage" },
    ];
    await service().read(period);
    expect(db.transaction.count.mock.calls[0][0].where.AND).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          OR: [
            { originBranchId: { in: [10, 20] } },
            { destinationBranchId: { in: [10, 20] } },
          ],
        }),
      ]),
    );
    await expect(
      service().read({ ...period, branchId: "99" }),
    ).rejects.toHaveProperty("status", 403);
  });
  it("preserves null quantities and both branch nulls without coercion", async () => {
    db.transaction.findMany.mockResolvedValue([
      { ...row, koli: null, kilo: null, originBranch: null },
    ]);
    const result = await service().read(period);
    expect(result.items[0]).toMatchObject({
      koli: null,
      kilo: null,
      originBranch: null,
      destinationBranch: null,
    });
  });
});
