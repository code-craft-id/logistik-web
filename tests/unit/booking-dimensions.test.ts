import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ prisma: {} }));
const { calculateDimensionTotals, priceAwb } = await import(
  "@/features/bookings/server/service"
);

describe("server-side per-piece pricing", () => {
  const rows = [
    {
      length: "100",
      width: "50",
      height: "40",
      kilo: "2",
      packed: true,
      packing: "100",
    },
    {
      length: "100",
      width: "100",
      height: "40",
      kilo: "120",
      packed: true,
      packing: "20",
    },
  ];

  it("sums volume and max(volume, weight) per koli with decimal arithmetic", () => {
    expect(calculateDimensionTotals(rows, "4000", 2)).toEqual({
      kilo: "122.00",
      volume: "150.000",
      chargeableWeight: "170.00",
      packingFee: "120",
    });
  });

  it("recalculates freight and ignores client summary fields", () => {
    const result = priceAwb({
      pricingType: "KG",
      koli: 2,
      dimensionRows: rows,
      modeDivider: "4000",
      chargeableWeight: "1.00",
      kilo: "1.00",
      volume: "1.000",
      packingFee: "1",
      pricePerKg: "100",
    });
    expect(result).toMatchObject({
      kilo: "122.00",
      volume: "150.000",
      packingFee: "120",
      chargeableWeight: "170.00",
      totalCost: "17120.00",
      biaya: "17120.00",
    });
  });

  it("rejects incomplete piece counts and dimensions", () => {
    expect(() => calculateDimensionTotals(rows, "4000", 3)).toThrow(
      "VALIDATION_DIMENSION_KOLI",
    );
    expect(() =>
      calculateDimensionTotals(
        [{ length: "100", width: "", height: "40", kilo: "2" }],
        "4000",
        1,
      ),
    ).toThrow("VALIDATION_DIMENSION_FIELDS");
  });

  it("does not use floating point for currency output", () => {
    const result = priceAwb({
      pricingType: "KG",
      kilo: "1.00",
      pricePerKg: "0.10",
      otherFee: "0.20",
      pickupFee: "0.10",
    });
    expect(result.totalCost).toBe("0.40");
  });
});
