import { describe, expect, it } from "vitest";
import {
  changePercent,
  executiveSummary,
  statusBuckets,
} from "@/features/reports/operational/dashboard-summary";

describe("dashboard rule-based summary", () => {
  it("maps stored statuses to provider buckets", () => {
    expect(
      statusBuckets([
        { status: "Delivered", count: 2 },
        { status: "In Transit", count: 3 },
        { status: "Returned", count: 1 },
        { status: "Open", count: 4 },
        { status: "Cancelled", count: 5 },
      ]),
    ).toEqual({
      total: 15,
      success: 2,
      onDelivery: 3,
      failedReturn: 1,
      pending: 4,
      other: 5,
    });
  });
  it("returns null change without a previous base", () => {
    expect(changePercent("10", "0")).toBeNull();
    expect(changePercent(15, 10)).toBe(50);
  });
  it("recommends follow-ups only for non-zero problems", () => {
    const quiet = executiveSummary({
      buckets: statusBuckets([{ status: "Delivered", count: 1 }]),
      awbPending: 0,
      podOutstanding: 0,
      invoicesOutstanding: 0,
      amountText: null,
      topCustomer: null,
    });
    expect(quiet.recommendations).toEqual([
      "Tidak ada tindakan mendesak untuk periode ini.",
    ]);
    const busy = executiveSummary({
      buckets: statusBuckets([
        { status: "Open", count: 3 },
        { status: "Returned", count: 1 },
      ]),
      awbPending: 3,
      podOutstanding: 0,
      invoicesOutstanding: null,
      amountText: "Rp 10",
      topCustomer: null,
    });
    expect(busy.lines[0]).toBe("Total transaksi periode ini Rp 10 dari 4 AWB.");
    expect(busy.recommendations).toHaveLength(3);
  });
});
