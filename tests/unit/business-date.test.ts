import { describe, expect, it } from "vitest";
import {
  businessDateAfterUtc,
  businessDateStartUtc,
  businessDateString,
  businessDateTimeString,
} from "@/lib/date/business-date";

describe("Asia/Jakarta business date helpers", () => {
  it("formats instants as Jakarta dates and times", () => {
    const instant = new Date("2026-11-30T17:00:00.000Z");
    expect(businessDateString(instant)).toBe("2026-12-01");
    expect(businessDateTimeString(instant)).toBe("2026-12-01 00:00");
  });

  it("maps an inclusive Jakarta date range to UTC instants", () => {
    expect(businessDateStartUtc("2026-12-01").toISOString()).toBe(
      "2026-11-30T17:00:00.000Z",
    );
    expect(businessDateAfterUtc("2026-12-01").toISOString()).toBe(
      "2026-12-01T17:00:00.000Z",
    );
  });

  it("rejects impossible calendar dates", () => {
    expect(() => businessDateStartUtc("2026-02-29")).toThrow(RangeError);
  });
});
