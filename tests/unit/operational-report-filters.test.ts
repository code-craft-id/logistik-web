import { describe, expect, it } from "vitest";
import { parseOperationalFilters } from "../../src/features/reports/operational/filters";

const period = { startDate: "2026-11-01", endDate: "2026-11-15" };
describe("operational report query boundaries", () => {
  it("reuses exact UTC and paging bounds and selects DRS by default", () => {
    const parsed = parseOperationalFilters("delivery", period);
    expect(parsed.view).toBe("sheets");
    expect(parsed.parsed).toMatchObject({
      status: "valid",
      filters: {
        from: new Date("2026-11-01T00:00:00Z"),
        toExclusive: new Date("2026-11-16T00:00:00Z"),
        page: 1,
        take: 20,
      },
    });
    expect(
      parseOperationalFilters("delivery", { ...period, view: "items" }).view,
    ).toBe("items");
  });
  it.each([
    "wrong",
    ["items", "sheets"],
    1,
  ])("rejects ambiguous delivery view %j", (view) => {
    expect(
      parseOperationalFilters("delivery", { ...period, view }).parsed.status,
    ).toBe("invalid");
  });
  it("rejects view on other reports, unknown keys, arrays and invalid dates", () => {
    for (const input of [
      { ...period, view: "items" },
      { ...period, status: "Delivered" },
      [],
      null,
      { ...period, endDate: "2026-12-02" },
    ])
      expect(parseOperationalFilters("manifest", input).parsed.status).toBe(
        "invalid",
      );
  });
  it("opens the dashboard on the current UTC month to date, like legacy", () => {
    const parsed = parseOperationalFilters(
      "dashboard",
      {},
      new Date("2026-11-18T22:30:00Z"),
    ).parsed;
    expect(parsed.status).toBe("valid");
    if (parsed.status !== "valid") return;
    expect(parsed.filters).toMatchObject({
      startDate: "2026-11-01",
      endDate: "2026-11-18",
    });
    expect(parseOperationalFilters("manifest", {}).parsed.status).toBe(
      "initial",
    );
  });
  it("does not silently ignore dashboard search or pagination", () => {
    expect(parseOperationalFilters("dashboard", period).parsed.status).toBe(
      "valid",
    );
    for (const input of [
      { ...period, search: "secret" },
      { ...period, page: "2" },
      { ...period, pageSize: "50" },
    ])
      expect(parseOperationalFilters("dashboard", input).parsed.status).toBe(
        "invalid",
      );
  });
});

it.each([
  "manifest",
  "delivery",
  "dashboard",
  "vendor",
] as const)("keeps transaction-only keys out of %s reports", (kind) => {
  for (const key of [
    "originBranchId",
    "destinationBranchId",
    "sortBy",
    "sortDirection",
  ]) {
    for (const value of ["1", "", undefined])
      expect(
        parseOperationalFilters(kind, { ...period, [key]: value }).parsed
          .status,
      ).toBe("invalid");
  }
});
