import { describe, expect, it } from "vitest";
import {
  CODE128_PATTERNS,
  code128Modules,
  code128Values,
} from "../../src/lib/barcode/code128";

describe("Code 128 set B", () => {
  it("has 107 distinct symbols of 11 modules (stop 13)", () => {
    expect(CODE128_PATTERNS).toHaveLength(107);
    expect(new Set(CODE128_PATTERNS).size).toBe(107);
    CODE128_PATTERNS.forEach((pattern, index) => {
      const sum = [...pattern].reduce((n, d) => n + Number(d), 0);
      expect(sum).toBe(index === 106 ? 13 : 11);
    });
  });
  it("encodes start B, data, weighted mod-103 checksum and stop", () => {
    // 104 + 55·1 + 73·2 + 75·3 + 73·4 + 80·5 + 69·6 + 68·7 + 73·8 + 65·9 = 3281 → 88
    expect(code128Values("Wikipedia")).toEqual([
      104, 55, 73, 75, 73, 80, 69, 68, 73, 65, 88, 106,
    ]);
    const modules = code128Modules("AWB-001");
    expect(modules.reduce((n, w) => n + w, 0)).toBe(11 * (7 + 2) + 13);
  });
  it("rejects empty and non-printable input", () => {
    expect(() => code128Values("")).toThrow();
    expect(() => code128Values("AWB\n1")).toThrow();
  });
});
