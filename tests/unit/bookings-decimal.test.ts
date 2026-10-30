import { describe, expect, it } from "vitest";
import {
  createBookingSchema,
  createTransactionSchema,
} from "@/features/bookings/schemas";

describe("bookings decimal validation", () => {
  it("accepts valid decimal strings for kilo/volume/biaya", () => {
    const booking = createBookingSchema.parse({
      kilo: "10.25",
      volume: "1.234",
      biaya: "150000.50",
    });
    expect(booking.kilo).toBe("10.25");
    expect(booking.volume).toBe("1.234");
    expect(booking.biaya).toBe("150000.50");

    const tx = createTransactionSchema.parse({
      originBranchId: 1,
      kilo: "5.00",
      volume: "0.500",
      biaya: "50000.00",
    });
    expect(tx.kilo).toBe("5.00");
    expect(tx.volume).toBe("0.500");
    expect(tx.biaya).toBe("50000.00");
  });

  it("rejects negative values", () => {
    expect(() => createBookingSchema.parse({ kilo: "-1" })).toThrow();
    expect(() => createTransactionSchema.parse({ originBranchId: 1, volume: "-0.1" })).toThrow();
    expect(() => createBookingSchema.parse({ biaya: "-5" })).toThrow();
  });

  it("rejects invalid formats", () => {
    expect(() => createBookingSchema.parse({ kilo: "10.123" })).toThrow();
    expect(() => createTransactionSchema.parse({ originBranchId: 1, volume: "1.2345" })).toThrow();
    expect(() => createBookingSchema.parse({ biaya: "abc" })).toThrow();
    expect(() => createBookingSchema.parse({ kilo: "1.2.3" })).toThrow();
  });

  it("rejects out of range values", () => {
    expect(() => createBookingSchema.parse({ kilo: "999999999.99" })).toThrow();
    expect(() => createTransactionSchema.parse({ originBranchId: 1, biaya: "99999999999999.99" })).toThrow();
  });

  it("normalizes safe numbers without floating point string artifacts", () => {
    const booking = createBookingSchema.parse({ kilo: 10.25, volume: 1.234, biaya: 150000.5 });
    expect(booking.kilo).toBe("10.25");
    expect(booking.volume).toBe("1.234");
    expect(booking.biaya).toBe("150000.50");
  });

  it("allows null/undefined/empty", () => {
    const booking = createBookingSchema.parse({ kilo: null, volume: undefined, biaya: "" });
    expect(booking.kilo).toBeNull();
    expect(booking.volume).toBeUndefined();
    expect(booking.biaya).toBeUndefined();
  });
});
