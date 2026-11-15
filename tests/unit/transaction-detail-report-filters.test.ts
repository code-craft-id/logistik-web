import { describe, expect, it } from "vitest";
import { parseTransactionReportFilters } from "../../src/features/reports/transaction-details/filters";

const period = { startDate: "2026-11-01", endDate: "2026-11-15" };

describe("transaction report filter preparation", () => {
  it.each([
    {},
    { startDate: "", endDate: "" },
  ])("does not query before a period is selected: %j", (input) => {
    expect(parseTransactionReportFilters(input)).toEqual({ status: "initial" });
  });

  it("produces explicit UTC boundaries, defaults and a syntactic branch ID", () => {
    const result = parseTransactionReportFilters({
      ...period,
      branchId: "17",
      search: " AWB-42 ",
    });
    expect(result.status).toBe("valid");
    if (result.status !== "valid") throw new Error("Expected valid filters");
    expect(result.filters).toEqual({
      ...period,
      from: new Date("2026-11-01T00:00:00.000Z"),
      toExclusive: new Date("2026-11-16T00:00:00.000Z"),
      branchId: 17,
      search: "AWB-42",
      page: 1,
      pageSize: 20,
      skip: 0,
      take: 20,
    });
  });

  it.each([
    ["2024-02-29", "2024-03-01", "2024-03-02T00:00:00.000Z"],
    ["2026-12-31", "2026-12-31", "2027-01-01T00:00:00.000Z"],
    ["2026-03-01", "2026-03-31", "2026-04-01T00:00:00.000Z"],
    ["2026-03-08", "2026-03-08", "2026-03-09T00:00:00.000Z"],
    ["0099-01-01", "0099-01-01", "0099-01-02T00:00:00.000Z"],
  ])("accepts real calendar boundaries %s..%s", (startDate, endDate, end) => {
    const result = parseTransactionReportFilters({ startDate, endDate });
    expect(result.status).toBe("valid");
    if (result.status !== "valid") throw new Error("Expected valid filters");
    expect(result.filters.from.toISOString()).toBe(
      `${startDate}T00:00:00.000Z`,
    );
    expect(result.filters.toExclusive.toISOString()).toBe(end);
    expect(result.filters.branchId).toBeNull();
  });

  it.each([
    { startDate: "2026-02-29" },
    { startDate: "2026-04-31" },
    { startDate: "2026-13-01" },
    { startDate: "2026-00-01" },
    { startDate: "2026-11-00" },
    { startDate: "2026-1-01" },
    { startDate: "2026-11-01T00:00:00Z" },
    { startDate: " 2026-11-01" },
    { startDate: "0000-01-01" },
    { startDate: "2026-11-16" },
    { startDate: "2026-10-15" },
    { endDate: "2026-02-30" },
    { endDate: "" },
    { startDate: undefined },
  ])("rejects malformed, partial, reversed or over-31-day dates %j", (extra) => {
    expect(parseTransactionReportFilters({ ...period, ...extra }).status).toBe(
      "invalid",
    );
  });

  it("accepts exactly 31 inclusive days but rejects 32", () => {
    expect(
      parseTransactionReportFilters({
        startDate: "2026-01-01",
        endDate: "2026-01-31",
      }).status,
    ).toBe("valid");
    expect(
      parseTransactionReportFilters({
        startDate: "2026-01-01",
        endDate: "2026-02-01",
      }).status,
    ).toBe("invalid");
  });

  it("bounds pagination at the documented maximum offset", () => {
    const result = parseTransactionReportFilters({
      ...period,
      page: "1000",
      pageSize: "100",
      branchId: "2147483647",
      search: "A".repeat(100),
    });
    expect(result.status).toBe("valid");
    if (result.status !== "valid") throw new Error("Expected valid filters");
    expect(result.filters).toMatchObject({
      page: 1000,
      pageSize: 100,
      skip: 99900,
      take: 100,
      branchId: 2147483647,
    });
  });

  it.each([
    { page: "0" },
    { page: "1001" },
    { page: "1.5" },
    { page: "1e2" },
    { page: "+1" },
    { page: " 1" },
    { page: "01" },
    { page: 1 },
    { page: "" },
    { pageSize: "0" },
    { pageSize: "101" },
    { pageSize: "Infinity" },
    { branchId: "0" },
    { branchId: "-1" },
    { branchId: "2147483648" },
    { branchId: "1.2" },
    { branchId: true },
    { search: "x".repeat(101) },
    { search: null },
    { status: "Paid" },
    { actorId: "1" },
  ])("rejects unsupported or non-canonical query values %j", (extra) => {
    expect(parseTransactionReportFilters({ ...period, ...extra }).status).toBe(
      "invalid",
    );
  });

  it.each([
    "startDate",
    "endDate",
    "branchId",
    "search",
    "page",
    "pageSize",
  ])("rejects even one-element arrays for %s", (field) => {
    expect(
      parseTransactionReportFilters({ ...period, [field]: ["1"] }).status,
    ).toBe("invalid");
  });

  it.each([
    null,
    [],
    "startDate=2026-11-01",
    1,
  ])("rejects a non-query root %j", (input) => {
    expect(parseTransactionReportFilters(input).status).toBe("invalid");
  });

  it("validates optional fields before returning the initial state", () => {
    expect(parseTransactionReportFilters({ page: "0" }).status).toBe("invalid");
    expect(parseTransactionReportFilters({ status: "Paid" }).status).toBe(
      "invalid",
    );
    expect(parseTransactionReportFilters({ branchId: "", search: "" })).toEqual(
      { status: "initial" },
    );
  });

  it("does not mutate input or include raw invalid values in errors", () => {
    const input = { ...period, branchId: "1", search: " AWB " };
    const original = { ...input };
    parseTransactionReportFilters(input);
    expect(input).toEqual(original);
    const result = parseTransactionReportFilters({
      ...period,
      search: ["secret"],
    });
    expect(result.status).toBe("invalid");
    expect(JSON.stringify(result)).not.toContain("secret");
  });
});
