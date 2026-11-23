import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AccessActor } from "../../src/features/identity/permissions";
import { createTicketService } from "../../src/features/ticketing/server/service";
import type { PrismaClient } from "../../src/lib/db/generated/client";

const input = {
  branchId: 10,
  subject: "Problem",
  menuName: "Menu",
  relatedPageUrl: "/safe",
  remarks: null,
  priority: "High",
  idempotencyKey: "d460cad2-5200-4a1f-8a98-9509932c93b7",
};
const actor = (): AccessActor => ({
  id: 1,
  status: "ACTIVE",
  branchIds: [10, 20],
  group: {
    id: 1,
    name: "FAKE",
    status: "ACTIVE",
    deletedAt: null,
    permissions: [
      { resource: "ticket", action: "view" },
      { resource: "ticket", action: "create" },
    ],
  },
});
let current: AccessActor | null;
function fixture() {
  if (!current?.group) throw new Error("Missing active fixture");
  return current as AccessActor & { group: NonNullable<AccessActor["group"]> };
}
const record = {
  ...input,
  id: 5,
  createdById: 1,
  deletedAt: null,
  createdAt: new Date("2026-11-15T00:00:00Z"),
  updatedAt: new Date("2026-11-15T00:00:00Z"),
  status: "Open",
  approval: null,
  approvalNote: null,
  approvedAt: null,
  approvedBy: null,
  createdBy: null,
};
const db = {
  user: { findUnique: vi.fn() },
  branch: { findFirst: vi.fn(), findMany: vi.fn() },
  ticket: {
    findMany: vi.fn(),
    count: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  $executeRaw: vi.fn(),
  $queryRaw: vi.fn(),
  $transaction: vi.fn(),
};
const service = () =>
  createTicketService(db as unknown as PrismaClient, async () => current);
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
  db.branch.findFirst.mockResolvedValue({ id: 10 });
  db.ticket.findMany.mockResolvedValue([record]);
  db.ticket.count.mockResolvedValue(1);
  db.ticket.findFirst.mockResolvedValue(null);
  db.ticket.create.mockResolvedValue(record);
  db.$transaction.mockImplementation(async (work) => work(db));
});
describe("ticket server authorization and atomic creation", () => {
  it("uses the same creator/current-membership SQL predicate for rows/count/detail", async () => {
    await service().list({});
    expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "RepeatableRead",
    });
    await service().detail(5);
    const where = {
      deletedAt: null,
      createdById: 1,
      branchId: { in: [10, 20] },
    };
    expect(db.ticket.findMany.mock.calls[0][0].where).toEqual(where);
    expect(db.ticket.count.mock.calls[0][0].where).toEqual(where);
    expect(db.ticket.findFirst.mock.calls[0][0].where).toEqual({
      ...where,
      id: 5,
    });
    expect(db.ticket.findMany.mock.calls[0][0].orderBy).toEqual([
      { createdAt: "desc" },
      { id: "desc" },
    ]);
  });
  it("keeps empty memberships empty and administrator reads global/nondeleted", async () => {
    fixture().branchIds = [];
    await service().list({});
    expect(db.ticket.count.mock.calls[0][0].where.branchId).toEqual({ in: [] });
    fixture().group.permissions = [
      { resource: "system_admin", action: "manage" },
    ];
    await service().list({});
    expect(db.ticket.count.mock.calls[1][0].where).toEqual({ deletedAt: null });
  });
  it.each([
    "anonymous",
    "inactive",
    "group-inactive",
    "no-grant",
  ])("denies %s before reading/writing", async (kind) => {
    if (kind === "anonymous") current = null;
    else if (kind === "inactive") fixture().status = "INACTIVE";
    else if (kind === "group-inactive") fixture().group.status = "INACTIVE";
    else fixture().group.permissions = [];
    await expect(service().list({})).rejects.toHaveProperty(
      "status",
      kind === "no-grant" ? 403 : 401,
    );
    await expect(service().create(input)).rejects.toBeDefined();
    expect(db.ticket.findMany).not.toHaveBeenCalled();
    expect(db.ticket.create).not.toHaveBeenCalled();
  });
  it("persists server creator and hides replay token in DTO", async () => {
    const result = await service().create(input);
    expect(db.ticket.create.mock.calls[0][0].data).toMatchObject({
      ...input,
      createdById: 1,
    });
    expect(result.id).toBe(5);
    expect(result).not.toHaveProperty("idempotencyKey");
  });
  it("validates active hierarchy even for admin and rejects unassigned creation", async () => {
    await expect(
      service().create({ ...input, branchId: 30 }),
    ).rejects.toHaveProperty("status", 403);
    fixture().group.permissions = [
      { resource: "system_admin", action: "manage" },
    ];
    db.branch.findFirst.mockResolvedValue(null);
    await expect(service().create(input)).rejects.toHaveProperty("status", 403);
    expect(db.ticket.create).not.toHaveBeenCalled();
    expect(db.branch.findFirst.mock.calls[0][0].where).toMatchObject({
      status: "ACTIVE",
      deletedAt: null,
      office: {
        status: "ACTIVE",
        deletedAt: null,
        company: { deletedAt: null },
      },
    });
  });
  it("replays identical normalized payload and rejects a changed payload", async () => {
    db.ticket.findFirst.mockResolvedValue(record);
    expect(
      (await service().create({ ...input, subject: " Problem " })).id,
    ).toBe(5);
    await expect(
      service().create({ ...input, subject: "Different" }),
    ).rejects.toHaveProperty("status", 409);
    expect(db.ticket.create).not.toHaveBeenCalled();
  });
  it("recovers unique races outside the failed transaction with fresh scoped authorization", async () => {
    db.ticket.create.mockRejectedValue({ code: "P2002" });
    db.ticket.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(record);
    expect((await service().create(input)).id).toBe(5);
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(db.user.findUnique.mock.calls.length).toBeGreaterThanOrEqual(3);
  });
  it("denies replay after scope is revoked during unique-race recovery", async () => {
    db.ticket.create.mockImplementation(async () => {
      fixture().branchIds = [];
      throw { code: "P2002" };
    });
    await expect(service().create(input)).rejects.toHaveProperty("status", 403);
  });
  it("reloads memberships after acquiring the mutation lock before any write", async () => {
    db.$queryRaw.mockImplementation(async () => {
      fixture().branchIds = [];
      return [];
    });
    await expect(service().create(input)).rejects.toHaveProperty("status", 403);
    expect(db.ticket.create).not.toHaveBeenCalled();
  });
  it("does not expose ticket data when a group loses its grant after the session resolves", async () => {
    db.user.findUnique.mockResolvedValue({
      ...actor(),
      group: { ...fixture().group, permissions: [] },
      allowedBranches: [{ branchId: 10 }],
    });
    await expect(service().list({})).rejects.toHaveProperty("status", 403);
    expect(db.ticket.findMany).not.toHaveBeenCalled();
  });
  it("returns the same missing result for inaccessible IDs", async () => {
    await expect(service().detail(5)).resolves.toBeNull();
    await expect(service().detail(999)).resolves.toBeNull();
  });
});

it("reloads list scope inside its transaction rather than trusting an earlier session", async () => {
  db.$transaction.mockImplementation(async (work) => {
    fixture().branchIds = [20];
    return work(db);
  });
  await service().list({ page: 3, pageSize: 10, search: " Menu " });
  expect(db.ticket.findMany.mock.calls[0][0]).toMatchObject({
    where: { createdById: 1, branchId: { in: [20] } },
    skip: 20,
    take: 10,
  });
  expect(db.ticket.findMany.mock.calls[0][0].where).toEqual(
    db.ticket.count.mock.calls[0][0].where,
  );
});
