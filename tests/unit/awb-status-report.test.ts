import { describe, expect, it } from "vitest";
import type { AwbStatusResult } from "../../src/features/reports/awb-status/contracts";
import { awbStatusCsv } from "../../src/features/reports/awb-status/csv";
import {
  awbView,
  defaultPeriod,
  parseAwbStatusFilters,
} from "../../src/features/reports/awb-status/filters";

describe("AWB status report filters", () => {
  it("lets LP-R10 run without dates and keeps other reports period-bound", () => {
    const pending = parseAwbStatusFilters("pending", {});
    expect(pending.allDates).toBe(true);
    expect(pending.parsed.status).toBe("valid");
    expect(parseAwbStatusFilters("manifested", {}).parsed.status).toBe(
      "initial",
    );
    const dated = parseAwbStatusFilters("pending", {
      startDate: "2026-11-01",
      endDate: "2026-11-02",
    });
    expect(dated.allDates).toBe(false);
  });

  it("accepts status only on LP-R21 and rejects sorting", () => {
    expect(
      parseAwbStatusFilters("all-status", {
        startDate: "2026-11-01",
        endDate: "2026-11-02",
        status: " Delivered ",
      }).status,
    ).toBe("Delivered");
    expect(
      parseAwbStatusFilters("pending", { status: "Open" }).parsed.status,
    ).toBe("invalid");
    expect(
      parseAwbStatusFilters("all-status", { status: "x".repeat(31) }).parsed
        .status,
    ).toBe("invalid");
    expect(
      parseAwbStatusFilters("manifested", { sortBy: "awbNo" }).parsed.status,
    ).toBe("invalid");
  });

  it("maps views and default periods like the legacy opening state", () => {
    expect(awbView(undefined)).toBe("pending");
    expect(awbView("manifested")).toBe("manifested");
    expect(awbView("other")).toBeNull();
    const now = new Date("2026-02-14T23:00:00Z");
    expect(defaultPeriod("manifested", now)).toEqual({
      startDate: "2026-02-01",
      endDate: "2026-02-28",
    });
    expect(defaultPeriod("all-status", now)).toEqual({
      startDate: "2026-02-15",
      endDate: "2026-02-15",
    });
    expect(defaultPeriod("pending", now)).toBeNull();
  });
});

describe("AWB status CSV", () => {
  it("uses the page columns, keeps blanks for unknown values and neutralizes formulas", () => {
    const result = {
      kind: "manifested",
      state: "ready",
      parsed: { status: "initial" },
      branches: [],
      statuses: [],
      statusFilter: null,
      allDates: false,
      canExport: true,
      total: 1,
      totals: null,
      items: [
        {
          id: 1,
          awbNo: "+SUM(1)",
          doNo: null,
          manifestNo: "M-1",
          manifestDate: "2026-11-04T08:00:00.000Z",
          destinationBranch: 'Kota "A"',
          koli: 2,
          kilo: null,
          volume: "0.5",
        },
      ],
    } satisfies AwbStatusResult;
    expect(awbStatusCsv(result).split("\r\n")).toEqual([
      '"AWB No.","DO No.","Manifes No.","Tanggal manifest (Asia/Jakarta)","Tujuan","Koli","Berat (kg)","Volume"',
      `"'+SUM(1)","","M-1","2026-11-04 15:00","Kota ""A""","2","","0.5"`,
      "",
    ]);
  });
});
