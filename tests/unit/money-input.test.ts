import { describe, expect, it } from "vitest";
import { moneyRaw, moneyText } from "@/components/ui/money-input";

describe("Rupiah input formatting", () => {
  it("submits plain numbers from formatted text", () => {
    expect(moneyRaw("1.250.000")).toBe("1250000");
    expect(moneyRaw("Rp 1.250.000,5")).toBe("1250000.5");
    expect(moneyRaw("0012")).toBe("12");
    expect(moneyRaw(",75")).toBe("0.75");
    expect(moneyRaw("")).toBe("");
  });
  it("shows thousand separators and keeps typed cents", () => {
    expect(moneyText("1250000")).toBe("1.250.000");
    expect(moneyText("150000.00")).toBe("150.000");
    expect(moneyText("1250000.5")).toBe("1.250.000,5");
    expect(moneyText("1250000.")).toBe("1.250.000,");
    expect(moneyText("")).toBe("");
  });
});
