import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ prisma: {} }));

import { nextAwbNo, nextBookingNo } from "@/features/bookings/server/service";

function numberingTransaction() {
  return {
    $queryRaw: vi
      .fn()
      .mockResolvedValueOnce([{ code: "JKT" }])
      .mockResolvedValueOnce([{ max: null }]),
  } as never;
}

describe("document number time basis", () => {
  const jakartaMonthBoundary = new Date("2026-11-30T17:00:00.000Z");

  it("uses Asia/Jakarta month/year for AWB numbering", async () => {
    await expect(
      nextAwbNo(numberingTransaction(), 7, jakartaMonthBoundary),
    ).resolves.toBe("JKT261200001");
  });

  it("uses Asia/Jakarta month/year for booking numbering too", async () => {
    await expect(
      nextBookingNo(numberingTransaction(), 7, jakartaMonthBoundary),
    ).resolves.toBe("B-JKT261200001");
  });
});
