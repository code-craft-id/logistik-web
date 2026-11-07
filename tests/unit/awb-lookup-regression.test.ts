import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/identity/server/context", () => ({
  currentIdentity: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getUserBranchScope: vi.fn(),
}));

vi.mock("@/features/identity/permissions", () => ({
  isAdministrator: vi.fn(),
}));

vi.mock("@/features/identity/server/access", () => {
  class IdentityError extends Error {
    constructor(public code: string, public status: number, message?: string) {
      super(message || code);
      this.name = "IdentityError";
    }
  }
  return {
    IdentityError,
    requireNonEmptyBranchScope: vi.fn(),
  };
});

vi.mock("@/lib/db", () => ({
  prisma: {
    transaction: {
      findMany: vi.fn(),
    },
  },
}));

import { lookupTransactionByAwb } from "@/features/bookings/server/queries";
import { prisma } from "@/lib/db";
import { IdentityError } from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";
import { getUserBranchScope } from "@/lib/auth/session";
import { isAdministrator } from "@/features/identity/permissions";
import * as access from "@/features/identity/server/access";
const requireNonEmptyBranchScope = (access as any).requireNonEmptyBranchScope;

describe("AWB lookup regression (PR #9)", () => {
  const txAtoB = {
    id: 101,
    awbNo: "AWB123",
    status: "IN_TRANSIT",
    transactionDate: new Date("2025-10-01"),
    originBranchId: 1,
    destinationBranchId: 2,
    deletedAt: null,
    originBranch: { id: 1, code: "A", name: "Cabang A" },
    destinationBranch: { id: 2, code: "B", name: "Cabang B" },
  };
  const txCtoB = {
    id: 102,
    awbNo: "AWB123",
    status: "DELIVERED",
    transactionDate: new Date("2025-10-02"),
    originBranchId: 3,
    destinationBranchId: 2,
    deletedAt: null,
    originBranch: { id: 3, code: "C", name: "Cabang C" },
    destinationBranch: { id: 2, code: "B", name: "Cabang B" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    if (requireNonEmptyBranchScope) {
      (requireNonEmptyBranchScope as any).mockImplementation(() => {});
    }
  });

  it("branch B user without origin filter sees both A→B and C→B", async () => {
    (isAdministrator as any).mockReturnValue(false);
    (currentIdentity as any).mockResolvedValue({ actor: { id: 10 } });
    (getUserBranchScope as any).mockResolvedValue([2]);
    (prisma.transaction.findMany as any).mockResolvedValue([txAtoB, txCtoB]);

    const res = await lookupTransactionByAwb("AWB123");
    expect(Array.isArray(res)).toBe(true);
    const arr = res as any[];
    expect(arr.length).toBe(2);
    const ids = arr.map((x) => x.id).sort();
    expect(ids).toEqual([101, 102]);
    const call = (prisma.transaction.findMany as any).mock.calls[0][0];
    expect(call.where.OR).toEqual([
      { originBranchId: { in: [2] } },
      { destinationBranchId: { in: [2] } },
    ]);
    expect(call.where.deletedAt).toBeNull();
  });

  it("branch B user with originBranchId A gets A→B without 403", async () => {
    (isAdministrator as any).mockReturnValue(false);
    (currentIdentity as any).mockResolvedValue({ actor: { id: 10 } });
    (getUserBranchScope as any).mockResolvedValue([2]);
    (prisma.transaction.findMany as any).mockResolvedValue([txAtoB]);

    const res = await lookupTransactionByAwb("AWB123", 1);
    expect(Array.isArray(res)).toBe(false);
    expect((res as any).id).toBe(101);
    const call = (prisma.transaction.findMany as any).mock.calls[0][0];
    expect(call.where.originBranchId).toBe(1);
    expect(call.where.OR).toEqual([
      { originBranchId: { in: [2] } },
      { destinationBranchId: { in: [2] } },
    ]);
  });

  it("user with access to other branch only cannot see A→B or C→B", async () => {
    (isAdministrator as any).mockReturnValue(false);
    (currentIdentity as any).mockResolvedValue({ actor: { id: 11 } });
    (getUserBranchScope as any).mockResolvedValue([5]);
    (prisma.transaction.findMany as any).mockResolvedValue([]);

    const res = await lookupTransactionByAwb("AWB123");
    expect(res).toBeNull();
    const call = (prisma.transaction.findMany as any).mock.calls[0][0];
    expect(call.where.OR).toEqual([
      { originBranchId: { in: [5] } },
      { destinationBranchId: { in: [5] } },
    ]);
  });

  it("non-admin without branch scope throws 403 via requireNonEmptyBranchScope", async () => {
    (isAdministrator as any).mockReturnValue(false);
    (currentIdentity as any).mockResolvedValue({ actor: { id: 12 } });
    (getUserBranchScope as any).mockResolvedValue([]);
    (requireNonEmptyBranchScope as any).mockImplementation(() => {
      throw new IdentityError("FORBIDDEN_BRANCH", 403);
    });

    await expect(lookupTransactionByAwb("AWB123")).rejects.toBeInstanceOf(IdentityError);
    await expect(lookupTransactionByAwb("AWB123")).rejects.toMatchObject({ status: 403 });
  });

  it("administrator follows global access contract and can see multiple matches", async () => {
    (isAdministrator as any).mockReturnValue(true);
    (currentIdentity as any).mockResolvedValue({ actor: { id: 1, group: { permissions: [{ resource: "system_admin", action: "manage" }] } } });
    (prisma.transaction.findMany as any).mockResolvedValue([txAtoB, txCtoB]);

    const res = await lookupTransactionByAwb("AWB123");
    expect(Array.isArray(res)).toBe(true);
    expect((res as any[]).length).toBe(2);
    const call = (prisma.transaction.findMany as any).mock.calls[0][0];
    expect(call.where.OR).toBeUndefined();
    expect(call.where.deletedAt).toBeNull();
  });

  it("filters by originBranchId for admin without OR scope", async () => {
    (isAdministrator as any).mockReturnValue(true);
    (currentIdentity as any).mockResolvedValue({ actor: { id: 1 } });
    (prisma.transaction.findMany as any).mockResolvedValue([txAtoB]);

    const res = await lookupTransactionByAwb("AWB123", 1);
    expect(Array.isArray(res)).toBe(false);
    expect((res as any).id).toBe(101);
    const call = (prisma.transaction.findMany as any).mock.calls[0][0];
    expect(call.where.originBranchId).toBe(1);
    expect(call.where.OR).toBeUndefined();
  });

  it("only returns active records (deletedAt null)", async () => {
    (isAdministrator as any).mockReturnValue(false);
    (currentIdentity as any).mockResolvedValue({ actor: { id: 10 } });
    (getUserBranchScope as any).mockResolvedValue([2]);
    (prisma.transaction.findMany as any).mockResolvedValue([]);

    await lookupTransactionByAwb("AWB123");
    const call = (prisma.transaction.findMany as any).mock.calls[0][0];
    expect(call.where.deletedAt).toBeNull();
  });
});
