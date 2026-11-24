import { expect, it } from "vitest";
import {
  groupDailyRecap,
  recapMoney,
} from "../../src/features/reports/recap/daily-recap-groups";

const line = (category: string, mode: string, onhand: number, kredit = 0) => ({
  category,
  mode,
  cs: "CS",
  awb: 1,
  onhand,
  transfer: 0,
  kredit,
  tagih: 0,
});

it("groups lines per category with subtotals and a grand total", () => {
  const { groups, total } = groupDailyRecap([
    line("Cargo", "DARAT", 1000),
    line("Cargo", "LAUT", 500, 250),
    line("Express", "UDARA", 2000),
  ]);
  expect(groups.map((g) => [g.category, g.lines.length])).toEqual([
    ["Cargo", 2],
    ["Express", 1],
  ]);
  expect(groups[0].subtotal).toMatchObject({
    awb: 2,
    onhand: 1500,
    kredit: 250,
  });
  expect(recapMoney(groups[0].subtotal)).toBe(1750);
  expect(total).toMatchObject({ awb: 3, onhand: 3500, kredit: 250 });
  expect(recapMoney(total)).toBe(3750);
});

it("returns an empty report with zero totals", () => {
  expect(groupDailyRecap([])).toEqual({
    groups: [],
    total: { awb: 0, onhand: 0, transfer: 0, kredit: 0, tagih: 0 },
  });
});
