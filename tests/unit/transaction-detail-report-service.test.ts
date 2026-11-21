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

it("intersects endpoint filters with legacy branch and current OR scope", async () => {
  const result = await service().read({
    ...period,
    branchId: "10",
    originBranchId: "10",
    destinationBranchId: "20",
    sortBy: "kilo",
    sortDirection: "asc",
  });
  expect(result.state).toBe("ready");
  expect(db.transaction.findMany.mock.calls[0][0]).toMatchObject({
    where: {
      AND: [
        {
          OR: [
            { originBranchId: { in: [10, 20] } },
            { destinationBranchId: { in: [10, 20] } },
          ],
        },
        { OR: [{ originBranchId: 10 }, { destinationBranchId: 10 }] },
        { originBranchId: 10 },
        { destinationBranchId: 20 },
      ],
    },
    orderBy: [{ kilo: { sort: "asc", nulls: "last" } }, { id: "asc" }],
  });
  expect(db.transaction.count.mock.calls[0][0].where).toEqual(
    db.transaction.findMany.mock.calls[0][0].where,
  );
});
it.each([
  "originBranchId",
  "destinationBranchId",
])("denies unauthorized %s for ordinary and administrator actors", async (field) => {
  for (const admin of [false, true]) {
    if (admin)
      fixture().group.permissions = [
        { resource: "system_admin", action: "manage" },
      ];
    await expect(
      service().read({ ...period, [field]: "99" }),
    ).rejects.toHaveProperty("status", 403);
  }
  expect(db.transaction.findMany).not.toHaveBeenCalled();
});
it.each([
  ["awbNo", { awbNo: { sort: "desc", nulls: "last" } }],
  ["transactionDate", { transactionDate: "desc" }],
  ["originBranch", { originBranch: { name: "desc" } }],
  ["destinationBranch", { destinationBranch: { name: "desc" } }],
  ["senderName", { senderName: { sort: "desc", nulls: "last" } }],
  ["receiverName", { receiverName: { sort: "desc", nulls: "last" } }],
  ["koli", { koli: { sort: "desc", nulls: "last" } }],
  ["kilo", { kilo: { sort: "desc", nulls: "last" } }],
  ["status", { status: "desc" }],
])("uses typed %s ordering and an ID tiebreaker", async (sortBy, primary) => {
  await service().read({ ...period, sortBy, sortDirection: "desc" });
  expect(db.transaction.findMany.mock.calls[0][0].orderBy).toEqual([
    primary,
    { id: "desc" },
  ]);
});

function allowExport() {
  fixture().group.permissions.push({
    resource: "transaction_report",
    action: "export",
  });
}
it("exports the entire identical predicate/order/projection in one bounded repeatable snapshot regardless of pagination", async () => {
  allowExport();
  const input = {
    ...period,
    branchId: "10",
    originBranchId: "10",
    destinationBranchId: "20",
    search: "_%",
    sortBy: "kilo",
    sortDirection: "asc",
    page: "9",
    pageSize: "1",
  };
  const read = await service().read(input);
  expect(read.canExport).toBe(true);
  const pageQuery = db.transaction.findMany.mock.calls[0][0];
  db.transaction.count.mockClear();
  const csv = await service().export(input);
  expect(db.$transaction).toHaveBeenLastCalledWith(expect.any(Function), {
    isolationLevel: "RepeatableRead",
  });
  expect(db.transaction.findMany.mock.calls[1][0]).toEqual({
    ...pageQuery,
    skip: 0,
    take: 5001,
  });
  expect(db.transaction.count).not.toHaveBeenCalled();
  expect(csv).toContain('"12.34"');
  expect(csv).not.toMatch(/secret|private|idempotencyKey|biaya|createdById/);
});
it.each([
  "anonymous",
  "view-only",
  "export-only",
  "revoked",
  "inactive",
])("denies %s export before reading source rows", async (kind) => {
  if (kind === "anonymous") current = null;
  if (kind === "export-only")
    fixture().group.permissions = [
      { resource: "transaction_report", action: "export" },
    ];
  if (kind === "revoked") {
    allowExport();
    db.user.findUnique.mockResolvedValue({
      ...actor(),
      allowedBranches: [{ branchId: 10 }],
    });
  }
  if (kind === "inactive") {
    allowExport();
    fixture().status = "INACTIVE";
  }
  await expect(service().export(period)).rejects.toHaveProperty(
    "status",
    kind === "anonymous" || kind === "inactive" ? 401 : 403,
  );
  expect(db.transaction.findMany).not.toHaveBeenCalled();
});
it("keeps UI capability derived from fresh authorization and never grants view-only export", async () => {
  expect((await service().read(period)).canExport).toBe(false);
  allowExport();
  expect((await service().read(period)).canExport).toBe(true);
  db.user.findUnique.mockResolvedValue({
    ...actor(),
    allowedBranches: [{ branchId: 10 }],
  });
  expect((await service().read(period)).canExport).toBe(false);
});
it("lets explicit administrators export while still validating selected branch options", async () => {
  fixture().group.permissions = [
    { resource: "system_admin", action: "manage" },
  ];
  await expect(service().export(period)).resolves.toContain("FAKE-AWB");
  await expect(
    service().export({ ...period, originBranchId: "99" }),
  ).rejects.toHaveProperty("status", 403);
});
it.each([
  {},
  { ...period, sortBy: ["kilo", "status"] },
  { ...period, unknown: "secret" },
  { ...period, endDate: "2026-12-31" },
])("rejects incomplete or malformed export filters without source reads: %j", async (input) => {
  allowExport();
  await expect(service().export(input)).rejects.toHaveProperty("status", 400);
  expect(db.transaction.findMany).not.toHaveBeenCalled();
});
it("requires current authorized endpoint options for export", async () => {
  allowExport();
  for (const field of ["branchId", "originBranchId", "destinationBranchId"])
    await expect(
      service().export({ ...period, [field]: "99" }),
    ).rejects.toHaveProperty("status", 403);
  expect(db.transaction.findMany).not.toHaveBeenCalled();
});
it("exports header-only empty scope/results and accepts 5000 rows while refusing 5001", async () => {
  allowExport();
  db.transaction.findMany.mockResolvedValue([]);
  const empty = await service().export(period);
  expect(empty.split("\r\n")).toHaveLength(2);
  db.transaction.findMany.mockResolvedValue(
    Array.from({ length: 5000 }, () => row),
  );
  expect((await service().export(period)).split("\r\n")).toHaveLength(5002);
  db.transaction.findMany.mockResolvedValue(
    Array.from({ length: 5001 }, () => row),
  );
  await expect(service().export(period)).rejects.toHaveProperty("status", 422);
  fixture().branchIds = [];
  db.branch.findMany.mockResolvedValue([]);
  db.transaction.findMany.mockClear();
  expect(await service().export(period)).toBe(empty);
  expect(db.transaction.findMany).not.toHaveBeenCalled();
});
