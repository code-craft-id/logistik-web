import { describe, expect, it } from "vitest";
import { createBookingSchema, createTransactionSchema } from "../../src/features/bookings/schemas";

describe("bookings schemas", () => {
  it("createBookingSchema strips status and treats empty optional numbers as undefined", () => {
    expect(() =>
      createBookingSchema.parse({
        bookingNo: "BK-001",
        status: "Delivered",
      }),
    ).toThrow();
    const parsed = createBookingSchema.parse({
      bookingNo: "BK-001",
      branchId: "",
      customerId: "   ",
      koli: "",
      kilo: "10.50",
      volume: "2.000",
      biaya: "100000.00",
    });
    expect((parsed as any).status).toBeUndefined();
    expect(parsed.branchId).toBeUndefined();
    expect(parsed.customerId).toBeUndefined();
    expect(parsed.koli).toBeUndefined();
    expect(parsed.kilo).toBe("10.50");
    expect(parsed.volume).toBe("2.000");
    expect(parsed.biaya).toBe("100000.00");
  });

  it("createTransactionSchema rejects client status and normalizes empty optionals", () => {
    expect(() =>
      createTransactionSchema.parse({
        originBranchId: "10",
        awbNo: "AWB-123",
        status: "Delivered",
      }),
    ).toThrow();
    const parsed = createTransactionSchema.parse({
      originBranchId: "10",
      destinationBranchId: "",
      bookingId: "   ",
      awbNo: "AWB-123",
      koli: "",
      kilo: "5.25",
      volume: "1.500",
      biaya: "50000.00",
    });
    expect((parsed as any).status).toBeUndefined();
    expect(parsed.originBranchId).toBe(10);
    expect(parsed.destinationBranchId).toBeUndefined();
    expect(parsed.bookingId).toBeUndefined();
    expect(parsed.kilo).toBe("5.25");
    expect(parsed.volume).toBe("1.500");
    expect(parsed.biaya).toBe("50000.00");
  });

  it("createTransactionSchema requires originBranchId", () => {
    expect(() => createTransactionSchema.parse({ awbNo: "AWB-1" })).toThrow();
    expect(() => createTransactionSchema.parse({ originBranchId: "" })).toThrow();
  });

  it("createTransactionSchema preserves decimal strings without float conversion", () => {
    const parsed = createTransactionSchema.parse({
      originBranchId: 1,
      kilo: 10.1,
      volume: 2.345,
      biaya: 123456.78,
    });
    expect(parsed.kilo).toBe("10.10");
    expect(parsed.volume).toBe("2.345");
    expect(parsed.biaya).toBe("123456.78");
  });
});
