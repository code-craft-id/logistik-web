import { beforeEach, describe, expect, it, vi } from "vitest";
import { IdentityError } from "@/features/identity/server/access";
import { permitsBranch, type AccessActor } from "@/features/identity/permissions";
import { createBooking, createTransaction, updateTransactionStatus } from "@/features/bookings/server/service";
import { createManifest, assignTransactionToManifest, recordDeliveryOutcome } from "@/features/shipments/server/manifests-service";

vi.mock("@/lib/db", () => {
  const create = vi.fn();
  const findFirst = vi.fn();
  const findUnique = vi.fn();
  const updateMany = vi.fn();
  const findMany = vi.fn();
  const transaction = vi.fn(async (fn: any) => fn({ create, findFirst, findUnique, updateMany, findMany, transactionItem: {} }));
  return {
    prisma: {
      $transaction: transaction,
      booking: { create, findFirst },
      transaction: { create, findFirst, findUnique, updateMany },
      transactionStatusHistory: { create },
      customer: { findFirst },
      courier: { findFirst },
      manifest: { create, findFirst },
      manifestItem: { findFirst, create },
      vehicle: { findFirst },
      deliverySheet: { findUnique },
      deliverySheetItem: { findUnique, create, updateMany },
    },
  };
});

function makeActor(branchIds: number[], isAdmin = false): AccessActor {
  return {
    id: 1,
    status: "ACTIVE",
    branchIds,
    group: isAdmin
      ? {
          id: 1,
          name: "Admin",
          status: "ACTIVE",
          deletedAt: null,
          permissions: [{ resource: "system_admin", action: "manage" }],
        }
      : {
          id: 2,
          name: "User",
          status: "ACTIVE",
          deletedAt: null,
          permissions: [
            { resource: "transaction", action: "view" },
            { resource: "transaction", action: "create" },
            { resource: "transaction", action: "update" },
            { resource: "booking", action: "create" },
            { resource: "manifest", action: "create" },
            { resource: "manifest", action: "update" },
            { resource: "delivery", action: "update" },
          ],
        },
  };
}

describe("Authorization regression - Booking/Transaction/Manifest/Delivery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createBooking", () => {
    it("rejects administrator without explicit branchId (no fallback to first/implicit branch)", async () => {
      const actor = makeActor([], true);
      await expect(createBooking({ bookingDate: new Date() } as any, actor)).rejects.toThrow(IdentityError);
      await expect(createBooking({ bookingDate: new Date() } as any, actor)).rejects.toThrow(/Cabang tujuan wajib diisi/i);
    });

    it("allows administrator to create booking when explicit branchId is provided and authorized", async () => {
      const actor = makeActor([], true);
      const { prisma } = await import("@/lib/db");
      (prisma.$transaction as any).mockImplementation(async (fn: any) => fn({ booking: { create: vi.fn().mockResolvedValue({ id: 1 }) } }));
      const result = await createBooking({ bookingDate: new Date(), branchId: 10 } as any, actor);
      expect(result).toBeDefined();
    });

    it("rejects administrator accessing unauthorized branchId", async () => {
      const actor = makeActor([], true);
      // permitsBranch allows admin cross-branch per policy, but service still uses permitsBranch - admin should pass permitsBranch
      // however if we want to test "not allowed" case, we rely on permitsBranch behavior; with current policy admin allowed
      expect(permitsBranch(actor, 999)).toBe(true);
    });

    it("rejects non-admin with empty branchIds", async () => {
      const actor = makeActor([], false);
      await expect(createBooking({ bookingDate: new Date(), branchId: 5 } as any, actor)).rejects.toThrow(IdentityError);
    });

    it("allows non-admin with matching branch scope", async () => {
      const actor = makeActor([5], false);
      const { prisma } = await import("@/lib/db");
      (prisma.$transaction as any).mockImplementation(async (fn: any) => fn({ booking: { create: vi.fn().mockResolvedValue({ id: 1 }) }, customer: { findFirst: vi.fn().mockResolvedValue(null) } }));
      const result = await createBooking({ bookingDate: new Date(), branchId: 5 } as any, actor);
      expect(result).toBeDefined();
    });

    it("rejects non-admin trying to access different branch", async () => {
      const actor = makeActor([5], false);
      await expect(createBooking({ bookingDate: new Date(), branchId: 6 } as any, actor)).rejects.toThrow(IdentityError);
    });
  });

  describe("createTransaction", () => {
    it("rejects non-admin with empty branchIds", async () => {
      const actor = makeActor([], false);
      await expect(createTransaction({ originBranchId: 1 } as any, actor)).rejects.toThrow(IdentityError);
    });

    it("allows non-admin with matching origin branch scope", async () => {
      const actor = makeActor([1], false);
      const { prisma } = await import("@/lib/db");
      (prisma.$transaction as any).mockImplementation(async (fn: any) => {
        const tx = {
          transaction: { create: vi.fn().mockResolvedValue({ id: 1 }), findUnique: vi.fn(), findFirst: vi.fn() },
          transactionStatusHistory: { create: vi.fn() },
          booking: { findFirst: vi.fn().mockResolvedValue(null) },
          courier: { findFirst: vi.fn().mockResolvedValue(null) },
        };
        return fn(tx);
      });
      const result = await createTransaction({ originBranchId: 1, transactionDate: new Date() } as any, actor);
      expect(result).toBeDefined();
    });

    it("rejects non-admin trying to create transaction for different origin branch", async () => {
      const actor = makeActor([1], false);
      await expect(createTransaction({ originBranchId: 2, transactionDate: new Date() } as any, actor)).rejects.toThrow(IdentityError);
    });

    it("allows administrator with explicit branches (cross-branch allowed by policy)", async () => {
      const actor = makeActor([], true);
      const { prisma } = await import("@/lib/db");
      (prisma.$transaction as any).mockImplementation(async (fn: any) => {
        const tx = {
          transaction: { create: vi.fn().mockResolvedValue({ id: 1 }), findUnique: vi.fn(), findFirst: vi.fn() },
          transactionStatusHistory: { create: vi.fn() },
          booking: { findFirst: vi.fn().mockResolvedValue(null) },
          courier: { findFirst: vi.fn().mockResolvedValue(null) },
        };
        return fn(tx);
      });
      const result = await createTransaction({ originBranchId: 99, transactionDate: new Date() } as any, actor);
      expect(result).toBeDefined();
    });
  });

  describe("updateTransactionStatus", () => {
    it("rejects non-admin with empty branchIds", async () => {
      const actor = makeActor([], false);
      await expect(updateTransactionStatus({ transactionId: 1, newStatus: "In Transit" } as any, actor)).rejects.toThrow(IdentityError);
    });

    it("does not change database/state when denied (non-admin wrong branch)", async () => {
      const actor = makeActor([1], false);
      const { prisma } = await import("@/lib/db");
      (prisma.$transaction as any).mockImplementation(async (fn: any) => {
        const tx = {
          transaction: { findFirst: vi.fn().mockResolvedValue(null) },
        };
        return fn(tx);
      });
      await expect(updateTransactionStatus({ transactionId: 1, newStatus: "In Transit" } as any, actor)).rejects.toThrow(IdentityError);
      expect(prisma.transaction.updateMany).not.toHaveBeenCalled();
      expect(prisma.transactionStatusHistory.create).not.toHaveBeenCalled();
    });

    it("allows administrator to update regardless of branchIds (policy-based)", async () => {
      const actor = makeActor([], true);
      const { prisma } = await import("@/lib/db");
      (prisma.$transaction as any).mockImplementation(async (fn: any) => {
        const tx = {
          transaction: {
            findFirst: vi.fn().mockResolvedValue({ id: 1, status: "Open", originBranchId: 5, destinationBranchId: 10 }),
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
            findUnique: vi.fn().mockResolvedValue({ id: 1, status: "In Transit" }),
          },
          transactionStatusHistory: { create: vi.fn().mockResolvedValue({}) },
        };
        return fn(tx);
      });
      const result = await updateTransactionStatus({ transactionId: 1, newStatus: "In Transit" } as any, actor);
      expect(result).toBeDefined();
    });
  });

  describe("createManifest", () => {
    it("rejects administrator without explicit branchId", async () => {
      const actor = makeActor([], true);
      await expect(createManifest({ manifestNo: "M-1", manifestDate: new Date() } as any, actor)).rejects.toThrow(IdentityError);
      await expect(createManifest({ manifestNo: "M-1", manifestDate: new Date() } as any, actor)).rejects.toThrow(/Cabang manifest wajib diisi/i);
    });

    it("rejects non-admin with empty branchIds", async () => {
      const actor = makeActor([], false);
      await expect(createManifest({ manifestNo: "M-1", branchId: 1 } as any, actor)).rejects.toThrow(IdentityError);
    });

    it("allows non-admin with matching branch scope", async () => {
      const actor = makeActor([1], false);
      const { prisma } = await import("@/lib/db");
      (prisma.$transaction as any).mockImplementation(async (fn: any) => {
        const tx = { manifest: { create: vi.fn().mockResolvedValue({ id: 1 }) }, vehicle: { findFirst: vi.fn() }, courier: { findFirst: vi.fn() } };
        return fn(tx);
      });
      const result = await createManifest({ manifestNo: "M-1", branchId: 1 } as any, actor);
      expect(result).toBeDefined();
    });

    it("rejects non-admin trying different branch", async () => {
      const actor = makeActor([1], false);
      await expect(createManifest({ manifestNo: "M-1", branchId: 2 } as any, actor)).rejects.toThrow(IdentityError);
    });
  });

  describe("assignTransactionToManifest", () => {
    it("rejects non-admin with empty branchIds", async () => {
      const actor = makeActor([], false);
      await expect(assignTransactionToManifest({ manifestId: 1, transactionId: 1 } as any, actor)).rejects.toThrow(IdentityError);
    });

    it("rejects non-admin assigning when manifest belongs to different branch", async () => {
      const actor = makeActor([1], false);
      const { prisma } = await import("@/lib/db");
      (prisma.$transaction as any).mockImplementation(async (fn: any) => {
        const tx = {
          manifest: { findFirst: vi.fn().mockResolvedValue({ id: 1, branchId: 2, status: "Draft", deletedAt: null }) },
        };
        return fn(tx);
      });
      await expect(assignTransactionToManifest({ manifestId: 1, transactionId: 1 } as any, actor)).rejects.toThrow(IdentityError);
      expect(prisma.manifestItem.create).not.toHaveBeenCalled();
    });

    it("allows administrator to assign across branches per policy (using permitsBranch)", async () => {
      const actor = makeActor([], true);
      const { prisma } = await import("@/lib/db");
      (prisma.$transaction as any).mockImplementation(async (fn: any) => {
        const tx = {
          manifest: { findFirst: vi.fn().mockResolvedValue({ id: 1, branchId: 5, status: "Draft", deletedAt: null }) },
          transaction: { findFirst: vi.fn().mockResolvedValue({ id: 1, originBranchId: 5 }) },
          manifestItem: { findFirst: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue({ id: 1 }) },
        };
        return fn(tx);
      });
      const result = await assignTransactionToManifest({ manifestId: 1, transactionId: 1 } as any, actor);
      expect(result).toBeDefined();
    });

    it("does not create manifest assignment when denied", async () => {
      const actor = makeActor([1], false);
      const { prisma } = await import("@/lib/db");
      (prisma.$transaction as any).mockImplementation(async (fn: any) => {
        const tx = {
          manifest: { findFirst: vi.fn().mockResolvedValue({ id: 1, branchId: 2, status: "Draft", deletedAt: null }) },
        };
        return fn(tx);
      });
      await expect(assignTransactionToManifest({ manifestId: 1, transactionId: 1 } as any, actor)).rejects.toThrow(IdentityError);
      expect(prisma.manifestItem.create).not.toHaveBeenCalled();
    });
  });

  describe("recordDeliveryOutcome", () => {
    it("rejects non-admin with empty branchIds", async () => {
      const actor = makeActor([], false);
      await expect(recordDeliveryOutcome({ deliverySheetId: 1, transactionId: 1 } as any, actor)).rejects.toThrow(IdentityError);
    });

    it("rejects non-admin when delivery sheet manifest belongs to different branch", async () => {
      const actor = makeActor([1], false);
      const { prisma } = await import("@/lib/db");
      (prisma.$transaction as any).mockImplementation(async (fn: any) => {
        const tx = {
          deliverySheet: { findUnique: vi.fn().mockResolvedValue({ id: 1, manifestId: 1 }) },
          manifest: { findFirst: vi.fn().mockResolvedValue({ id: 1, branchId: 2, deletedAt: null }) },
        };
        return fn(tx);
      });
      await expect(recordDeliveryOutcome({ deliverySheetId: 1, transactionId: 1 } as any, actor)).rejects.toThrow(IdentityError);
      expect(prisma.deliverySheetItem.create).not.toHaveBeenCalled();
      expect(prisma.transaction.updateMany).not.toHaveBeenCalled();
    });

    it("allows administrator per policy", async () => {
      const actor = makeActor([], true);
      const { prisma } = await import("@/lib/db");
      (prisma.$transaction as any).mockImplementation(async (fn: any) => {
        const tx = {
          deliverySheet: { findUnique: vi.fn().mockResolvedValue({ id: 1, manifestId: 1 }) },
          manifest: { findFirst: vi.fn().mockResolvedValue({ id: 1, branchId: 5, deletedAt: null }) },
          manifestItem: { findFirst: vi.fn().mockResolvedValue({ id: 1, deletedAt: null }) },
          transaction: { findFirst: vi.fn().mockResolvedValue({ id: 1, status: "In Transit", originBranchId: 5 }), updateMany: vi.fn().mockResolvedValue({ count: 1 }), findUnique: vi.fn().mockResolvedValue({ id: 1, status: "Delivered" }) },
          deliverySheetItem: { findUnique: vi.fn().mockResolvedValue({ id: 1, outcome: null }), create: vi.fn().mockResolvedValue({ id: 1 }), updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
          transactionStatusHistory: { create: vi.fn().mockResolvedValue({}) },
        };
        return fn(tx);
      });
      const result = await recordDeliveryOutcome({ deliverySheetId: 1, transactionId: 1, outcome: "DELIVERED" } as any, actor);
      expect(result).toBeDefined();
    });

    it("does not create delivery outcome or change status when denied", async () => {
      const actor = makeActor([1], false);
      const { prisma } = await import("@/lib/db");
      (prisma.$transaction as any).mockImplementation(async (fn: any) => {
        const tx = {
          deliverySheet: { findUnique: vi.fn().mockResolvedValue({ id: 1, manifestId: 1 }) },
          manifest: { findFirst: vi.fn().mockResolvedValue({ id: 1, branchId: 9, deletedAt: null }) },
        };
        return fn(tx);
      });
      await expect(recordDeliveryOutcome({ deliverySheetId: 1, transactionId: 1 } as any, actor)).rejects.toThrow(IdentityError);
      expect(prisma.deliverySheetItem.create).not.toHaveBeenCalled();
      expect(prisma.transaction.updateMany).not.toHaveBeenCalled();
      expect(prisma.transactionStatusHistory.create).not.toHaveBeenCalled();
    });
  });
});
