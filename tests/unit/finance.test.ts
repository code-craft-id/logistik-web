import { describe, expect, it } from "vitest";
import {
  date,
  invoiceCommand,
  money,
  sum,
} from "../../src/features/finance/contracts";

describe("adopted finance input", () => {
  it("keeps exact scale and rejects excess precision, overflow, exponent and nonpositive amounts", () => {
    expect(money.parse("0.10")).toBe("0.10");
    expect(sum(["0.10", "0.20"]).toFixed(2)).toBe("0.30");
    for (const value of ["0", "-1", "1.001", "1e3", "10000000000000.00", 100])
      expect(money.safeParse(value).success).toBe(false);
    expect(() => sum(["9999999999999.99", "0.01"])).toThrow();
  });
  it("validates calendar dates and distinct charge sources", () => {
    expect(date.safeParse("2026-02-29").success).toBe(false);
    expect(date.parse("2028-02-29")).toBe("2028-02-29");
    expect(
      invoiceCommand.safeParse({
        action: "invoice.create",
        key: crypto.randomUUID(),
        branchId: 1,
        customerId: 1,
        invoiceDate: "2026-11-15",
        dueDate: "2026-11-15",
        items: [
          { transactionId: 1, amount: "1.00" },
          { transactionId: 1, amount: "2.00" },
        ],
      }).success,
    ).toBe(false);
  });
});
