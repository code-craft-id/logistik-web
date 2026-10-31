import { describe, expect, it } from "vitest";
import { createBookingSchema, createTransactionSchema } from "../../../src/features/bookings/schemas";

describe("booking/awb idempotency schema and behavior", () => {
  it("creates valid transaction payload without client status", () => {
    const parsed = createTransactionSchema.parse({
      originBranchId: 10,
      awbNo: "AWB-IDEM-001",
      idempotencyKey: "idem-key-12345678",
      kilo: "1.50",
      volume: "0.5",
      biaya: "10000.00",
    });
    expect((parsed as any).status).toBeUndefined();
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
    expect(() => createTransactionSchema.parse({ originBranchId: "" })).toThrow();
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
      } as any),
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
      } as any),
    ).toThrow();
  });
});
