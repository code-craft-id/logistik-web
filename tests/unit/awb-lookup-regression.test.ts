import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import type { Transaction } from "@/lib/db/generated/client";

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
    constructor(
      public code: string,
      public status: number,
      message?: string,
    ) {
      super(message || code);
      this.name = "IdentityError";
    }
  }
  return {
    IdentityError,
  };
});

vi.mock("@/lib/db", () => ({
  prisma: {
    transaction: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/features/bookings/server/queries", async () => {
  const actual = await vi.importActual("@/features/bookings/server/queries");
  return {
    ...actual,
    requireNonEmptyBranchScope: vi.fn(),
  };
});

import {
  lookupTransactionByAwb,
  requireNonEmptyBranchScope,
} from "@/features/bookings/server/queries";
import { isAdministrator } from "@/features/identity/permissions";
import { IdentityError } from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";
import { getUserBranchScope } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

const isAdminMock = isAdministrator as Mock;
const currentIdentityMock = currentIdentity as Mock;
const getUserBranchScopeMock = getUserBranchScope as Mock;
const requireNonEmptyBranchScopeMock = requireNonEmptyBranchScope as Mock;
const prismaTransactionFindManyMock = prisma.transaction.findMany as Mock;

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
    requireNonEmptyBranchScopeMock.mockImplementation(() => {});
  });

  it("branch B user without origin filter sees both A→B and C→B", async () => {
    isAdminMock.mockReturnValue(false);
    currentIdentityMock.mockResolvedValue({ actor: { id: 10 } });
    getUserBranchScopeMock.mockResolvedValue([2]);
    prismaTransactionFindManyMock.mockResolvedValue([txAtoB, txCtoB]);

    const res = await lookupTransactionByAwb("AWB123");
    expect(Array.isArray(res)).toBe(true);
    const arr = res as Transaction[];
    expect(arr.length).toBe(2);
    const ids = arr.map((x) => x.id).sort();
    expect(ids).toEqual([101, 102]);
    const call = prismaTransactionFindManyMock.mock.calls[0][0];
    expect(call.where.OR).toEqual([
      { originBranchId: { in: [2] } },
      { destinationBranchId: { in: [2] } },
    ]);
    expect(call.where.deletedAt).toBeNull();
  });

  it("branch B user with originBranchId A gets A→B without 403", async () => {
    isAdminMock.mockReturnValue(false);
    currentIdentityMock.mockResolvedValue({ actor: { id: 10 } });
    getUserBranchScopeMock.mockResolvedValue([2]);
    prismaTransactionFindManyMock.mockResolvedValue([txAtoB]);

    const res = await lookupTransactionByAwb("AWB123", 1);
    expect(Array.isArray(res)).toBe(false);
    expect((res as Transaction).id).toBe(101);
    const call = prismaTransactionFindManyMock.mock.calls[0][0];
    expect(call.where.originBranchId).toBe(1);
    expect(call.where.OR).toEqual([
      { originBranchId: { in: [2] } },
      { destinationBranchId: { in: [2] } },
    ]);
  });

  it("user with access to other branch only cannot see A→B or C→B", async () => {
    isAdminMock.mockReturnValue(false);
    currentIdentityMock.mockResolvedValue({ actor: { id: 11 } });
    getUserBranchScopeMock.mockResolvedValue([5]);
    prismaTransactionFindManyMock.mockResolvedValue([]);

    const res = await lookupTransactionByAwb("AWB123");
    expect(res).toBeNull();
    const call = prismaTransactionFindManyMock.mock.calls[0][0];
    expect(call.where.OR).toEqual([
      { originBranchId: { in: [5] } },
      { destinationBranchId: { in: [5] } },
    ]);
  });

  it("non-admin without branch scope throws 403 via requireNonEmptyBranchScope", async () => {
    isAdminMock.mockReturnValue(false);
    currentIdentityMock.mockResolvedValue({ actor: { id: 12 } });
    getUserBranchScopeMock.mockResolvedValue([]);
    requireNonEmptyBranchScopeMock.mockImplementation(() => {
      throw new IdentityError("FORBIDDEN_BRANCH", 403);
    });

    await expect(lookupTransactionByAwb("AWB123")).rejects.toBeInstanceOf(
      IdentityError,
    );
    await expect(lookupTransactionByAwb("AWB123")).rejects.toMatchObject({
      status: 403,
    });
  });

  it("administrator follows global access contract and can see multiple matches", async () => {
    isAdminMock.mockReturnValue(true);
    currentIdentityMock.mockResolvedValue({
      actor: {
        id: 1,
        group: {
          permissions: [{ resource: "system_admin", action: "manage" }],
        },
      },
    });
    prismaTransactionFindManyMock.mockResolvedValue([txAtoB, txCtoB]);

    const res = await lookupTransactionByAwb("AWB123");
    expect(Array.isArray(res)).toBe(true);
    expect((res as Transaction[]).length).toBe(2);
    const call = prismaTransactionFindManyMock.mock.calls[0][0];
    expect(call.where.OR).toBeUndefined();
    expect(call.where.deletedAt).toBeNull();
  });

  it("filters by originBranchId for admin without OR scope", async () => {
    isAdminMock.mockReturnValue(true);
    currentIdentityMock.mockResolvedValue({ actor: { id: 1 } });
    prismaTransactionFindManyMock.mockResolvedValue([txAtoB]);

    const res = await lookupTransactionByAwb("AWB123", 1);
    expect(Array.isArray(res)).toBe(false);
    expect((res as Transaction).id).toBe(101);
    const call = prismaTransactionFindManyMock.mock.calls[0][0];
    expect(call.where.originBranchId).toBe(1);
    expect(call.where.OR).toBeUndefined();
  });

  it("only returns active records (deletedAt null)", async () => {
    isAdminMock.mockReturnValue(false);
    currentIdentityMock.mockResolvedValue({ actor: { id: 10 } });
    getUserBranchScopeMock.mockResolvedValue([2]);
    prismaTransactionFindManyMock.mockResolvedValue([]);

    await lookupTransactionByAwb("AWB123");
    const call = prismaTransactionFindManyMock.mock.calls[0][0];
    expect(call.where.deletedAt).toBeNull();
  });
});
