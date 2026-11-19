import { describe, expect, it } from "vitest";
import { formatRupiah } from "../../src/lib/format/rupiah";

describe("formatRupiah", () => {
  it("groups thousands with dots and keeps exact decimals", () => {
    expect(formatRupiah("121250")).toBe("Rp 121.250");
    expect(formatRupiah("121250.00")).toBe("Rp 121.250");
    expect(formatRupiah("1250.5")).toBe("Rp 1.250,50");
    expect(formatRupiah("0")).toBe("Rp 0");
    expect(formatRupiah(42500)).toBe("Rp 42.500");
    expect(formatRupiah("1234567890123.45")).toBe("Rp 1.234.567.890.123,45");
    expect(formatRupiah("-5000")).toBe("Rp -5.000");
  });
  it("handles empty values and the no-prefix form", () => {
    expect(formatRupiah(null)).toBe("-");
    expect(formatRupiah("")).toBe("-");
    expect(formatRupiah("8500", { prefix: false })).toBe("8.500");
  });
});
