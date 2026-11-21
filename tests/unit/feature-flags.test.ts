import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { awbScanEnabled } = await import("../../src/lib/features");
const original = process.env.FEATURE_AWB_SCAN;
afterEach(() => {
  process.env.FEATURE_AWB_SCAN = original;
});

describe("feature flags", () => {
  it("keeps Scan AWB hidden unless explicitly enabled", () => {
    delete process.env.FEATURE_AWB_SCAN;
    expect(awbScanEnabled()).toBe(false);
    process.env.FEATURE_AWB_SCAN = "1";
    expect(awbScanEnabled()).toBe(false);
    process.env.FEATURE_AWB_SCAN = "true";
    expect(awbScanEnabled()).toBe(true);
  });
});
