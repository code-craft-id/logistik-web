import { describe, expect, it } from "vitest";
import { createTransactionSchema } from "@/features/bookings/schemas";

describe("transaction creation security", () => {
  it("rejects explicit status field via schema", () => {
    const result = createTransactionSchema.safeParse({
      originBranchId: 1,
      status: "Delivered",
    });
    expect(result.success).toBe(false);
  });

  it("rejects explicit status field via schema (in transit)", () => {
    const result = createTransactionSchema.safeParse({
      originBranchId: 1,
      status: "In Transit",
    });
    expect(result.success).toBe(false);
  });

  it("accepts normal transaction payload without status", () => {
    const parsed = createTransactionSchema.parse({
      originBranchId: 1,
      senderName: "A",
      receiverName: "B",
    });
    expect(parsed.originBranchId).toBe(1);
    // Schema uses z.never().optional() for status, so it's not in the parsed output
    expect("status" in parsed).toBe(false);
  });
});
