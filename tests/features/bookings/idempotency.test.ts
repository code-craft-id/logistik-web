import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import type { AccessActor } from "@/features/identity/permissions";
import { Prisma } from "@/lib/db/generated/client";
import {
  createBookingSchema,
  createTransactionSchema,
} from "../../../src/features/bookings/schemas";
import { createTransaction } from "../../../src/features/bookings/server/service";

vi.mock("@/lib/db", () => {
  const create = vi.fn();
  const findFirst = vi.fn();
  const findUnique = vi.fn();
  const updateMany = vi.fn();
  const transaction = vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn({
      booking: { findFirst },
      courier: { findFirst },
      transaction: { create, findFirst, findUnique, updateMany },
      transactionStatusHistory: { create },
    }),
  );
  return {
    prisma: {
      $transaction: transaction,
      transaction: { create, findFirst, findUnique, updateMany },
      transactionStatusHistory: { create },
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
          permissions: [{ resource: "transaction", action: "create" }],
        },
  };
}

describe("booking/transaction schema (idempotency-related fields)", () => {
  it("creates valid transaction payload without client status", () => {
    const parsed = createTransactionSchema.parse({
      originBranchId: 10,
      awbNo: "AWB-IDEM-001",
      idempotencyKey: "idem-key-12345678",
      kilo: "1.50",
      volume: "0.5",
      biaya: "10000.00",
    });
    expect("status" in parsed).toBe(false);
    expect(parsed.originBranchId).toBe(10);
    expect(parsed.kilo).toBe("1.50");
  });

  it("treats empty optionals as undefined and normalizes decimals", () => {
    const parsed = createTransactionSchema.parse({
      originBranchId: "10",
      destinationBranchId: "",
      bookingId: "   ",
      kilo: 1.5,
      volume: 1.5,
      biaya: 1000,
    });
    expect(parsed.destinationBranchId).toBeUndefined();
    expect(parsed.bookingId).toBeUndefined();
    expect(parsed.kilo).toBe("1.50");
    expect(parsed.volume).toBe("1.500");
    expect(parsed.biaya).toBe("1000.00");
  });

  it("rejects payload without required originBranchId", () => {
    expect(() => createTransactionSchema.parse({ awbNo: "AWB-X" })).toThrow();
    expect(() =>
      createTransactionSchema.parse({ originBranchId: "" }),
    ).toThrow();
  });

  it("rejects client-supplied status", () => {
    expect(() =>
      createTransactionSchema.parse({
        originBranchId: 1,
        status: "Delivered",
      }),
    ).toThrow();
  });

  it("rejects unknown fields and internal identifiers in booking/transaction", () => {
    expect(() =>
      createBookingSchema.parse({
        branchId: 1,
        id: 999,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
        status: "Delivered",
        ownerBranchId: 2,
        extra: "x",
      }),
    ).toThrow();

    expect(() =>
      createTransactionSchema.parse({
        originBranchId: 1,
        id: 123,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
        status: "Delivered",
        internalFlag: true,
      }),
    ).toThrow();
  });

  it("normalizes empty/whitespace awbNo to null and keeps valid awbNo", () => {
    expect(
      createTransactionSchema.parse({ originBranchId: 1, awbNo: "" }).awbNo,
    ).toBeNull();
    expect(
      createTransactionSchema.parse({ originBranchId: 1, awbNo: "   " }).awbNo,
    ).toBeNull();
    expect(
      createTransactionSchema.parse({
        originBranchId: 1,
        awbNo: "AWB-VALID-123",
      }).awbNo,
    ).toBe("AWB-VALID-123");
  });

  it("parses explicit transactionDate and treats missing as undefined", () => {
    const parsed = createTransactionSchema.parse({
      originBranchId: 1,
      transactionDate: "2024-01-01T00:00:00.000Z",
    });
    expect(parsed.transactionDate).toBeInstanceOf(Date);
    expect(
      createTransactionSchema.parse({ originBranchId: 1 }).transactionDate,
    ).toBeUndefined();
  });
});

describe("createTransaction idempotency service behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns existing transaction on repeated request with same idempotency key and same payload (no duplicate create/history)", async () => {
    const actor = makeActor([1], false);
    const existing = {
      id: 42,
      idempotencyKey: "idem-key-12345678",
      awbNo: "AWB-SAME-1",
      originBranchId: 1,
      destinationBranchId: null,
      bookingId: null,
      doNo: null,
      senderName: null,
      receiverName: null,
      courierId: null,
      koli: 0,
      kilo: "1.5",
      volume: "0.5",
      biaya: "10000",
      status: "Open",
      deletedAt: null,
    };
    const { prisma } = await import("@/lib/db");
    const txTransactionCreate = vi.fn();
    const txHistoryCreate = vi.fn();
    (prisma.$transaction as Mock).mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          booking: { findFirst: vi.fn() },
          courier: { findFirst: vi.fn() },
          transaction: {
            findUnique: vi.fn().mockResolvedValue(existing),
            findFirst: vi.fn(),
            create: txTransactionCreate,
          },
          transactionStatusHistory: { create: txHistoryCreate },
        };
        return fn(tx);
      },
    );

    const result = await createTransaction(
      {
        originBranchId: 1,
        awbNo: "AWB-SAME-1",
        idempotencyKey: "idem-key-12345678",
        kilo: "1.50",
        volume: "0.500",
        biaya: "10000.00",
      },
      actor,
    );

    expect(result.created).toBe(false);
    expect(result.idempotent).toBe(true);
    expect(result.transaction.id).toBe(42);
    expect(txTransactionCreate).not.toHaveBeenCalled();
    expect(txHistoryCreate).not.toHaveBeenCalled();
  });

  it("rejects reused idempotency key with different payload (conflict)", async () => {
    const actor = makeActor([1], false);
    const existing = {
      id: 42,
      idempotencyKey: "idem-key-12345678",
      awbNo: "AWB-ORIG",
      originBranchId: 1,
      destinationBranchId: null,
      bookingId: null,
      doNo: null,
      senderName: null,
      receiverName: null,
      courierId: null,
      koli: 0,
      kilo: null,
      volume: null,
      biaya: null,
      status: "Open",
      deletedAt: null,
    };
    const { prisma } = await import("@/lib/db");
    (prisma.$transaction as Mock).mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          booking: { findFirst: vi.fn() },
          courier: { findFirst: vi.fn() },
          transaction: {
            findUnique: vi.fn().mockResolvedValue(existing),
            findFirst: vi.fn(),
            create: vi.fn(),
          },
          transactionStatusHistory: { create: vi.fn() },
        };
        return fn(tx);
      },
    );

    await expect(
      createTransaction(
        {
          originBranchId: 1,
          awbNo: "AWB-DIFFERENT",
          idempotencyKey: "idem-key-12345678",
        },
        actor,
      ),
    ).rejects.toThrow("IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD");
  });

  it("recovers from concurrent P2002 on idempotency key without duplicating transaction/history", async () => {
    const actor = makeActor([1], false);
    const existing = {
      id: 99,
      idempotencyKey: "idem-concurrent-key",
      awbNo: "AWB-CONC",
      originBranchId: 1,
      destinationBranchId: null,
      bookingId: null,
      doNo: null,
      senderName: null,
      receiverName: null,
      courierId: null,
      koli: 0,
      kilo: null,
      volume: null,
      biaya: null,
      status: "Open",
      deletedAt: null,
    };
    const { prisma } = await import("@/lib/db");
    const p2002 = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed",
      { code: "P2002", clientVersion: "test" } as never,
    );
    (prisma.$transaction as Mock).mockRejectedValue(p2002);
    (prisma.transaction.findUnique as Mock).mockResolvedValue(existing);
    (prisma.transaction.findFirst as Mock).mockResolvedValue(null);

    const result = await createTransaction(
      {
        originBranchId: 1,
        awbNo: "AWB-CONC",
        idempotencyKey: "idem-concurrent-key",
      },
      actor,
    );

    expect(result.created).toBe(false);
    expect(result.idempotent).toBe(true);
    expect(result.transaction.id).toBe(99);
    expect(prisma.transaction.findUnique).toHaveBeenCalledWith({
      where: { idempotencyKey: "idem-concurrent-key" },
    });
  });
});
