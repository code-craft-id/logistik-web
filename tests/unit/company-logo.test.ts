import { describe, expect, it } from "vitest";
import { validCompanyLogo } from "../../src/features/organization/company-logo";
import { companyInput } from "../../src/features/organization/contracts";

describe("existing company logo storage", () => {
  it("accepts bounded raster images and existing references", () => {
    const png =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==";
    expect(validCompanyLogo(png)).toBe(true);
    expect(companyInput.shape.logo.parse(png)).toBe(png);
    expect(validCompanyLogo("/existing-logo.png")).toBe(true);
    expect(validCompanyLogo(null)).toBe(true);
  });
  it("rejects SVG, mismatched headers, and oversized payloads", () => {
    for (const logo of [
      "data:image/svg+xml;base64,PHN2Zy8+",
      "data:image/png;base64,PGh0bWw+",
      `data:image/png;base64,${"A".repeat(350000)}`,
    ])
      expect(companyInput.shape.logo.safeParse(logo).success).toBe(false);
  });
});
