import { expect, it } from "vitest";
import { quantityTotals } from "../../src/features/reports/operational/server/quantities";
import { Prisma } from "../../src/lib/db/generated/client";

const row = (
  groupId: number,
  kilo: string | null,
  volume: string | null,
  koli: number | null = 0,
) => ({
  groupId,
  transaction: {
    koli,
    kilo: kilo === null ? null : new Prisma.Decimal(kilo),
    volume: volume === null ? null : new Prisma.Decimal(volume),
  },
});
it("sums decimals exactly per group and keeps each unknown dimension unknown", () => {
  const totals = quantityTotals(
    [1, 2, 3],
    [
      row(1, "0.1", "0.001", 2),
      row(1, "0.2", null, 0),
      row(2, null, "0", null),
    ],
  );
  expect(totals.get(1)).toEqual({
    totalKoli: 2,
    totalKilo: "0.3",
    totalVolume: null,
  });
  expect(totals.get(2)).toEqual({
    totalKoli: null,
    totalKilo: null,
    totalVolume: "0",
  });
  expect(totals.get(3)).toEqual({
    totalKoli: 0,
    totalKilo: "0",
    totalVolume: "0",
  });
});
it("accepts exactly 10000 sources and refuses overflow instead of reporting partial totals", () => {
  const sources = Array.from({ length: 10000 }, () =>
    row(1, "0.01", "0.001", 1),
  );
  expect(quantityTotals([1], sources).get(1)).toEqual({
    totalKoli: 10000,
    totalKilo: "100",
    totalVolume: "10",
  });
  expect(() => quantityTotals([1], [...sources, row(1, "0", "0")])).toThrow(
    /10.000/,
  );
  expect(() => quantityTotals([1], [row(2, "0", "0")])).toThrow(/outside/);
});
