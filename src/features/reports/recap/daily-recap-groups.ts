export type DailyRecapAmounts = {
  awb: number;
  onhand: number;
  transfer: number;
  kredit: number;
  tagih: number;
};
export type DailyRecapLine = DailyRecapAmounts & {
  category: string;
  mode: string;
  cs: string;
};
export type DailyRecapGroup = {
  category: string;
  lines: DailyRecapLine[];
  subtotal: DailyRecapAmounts;
};

const zero = (): DailyRecapAmounts => ({
  awb: 0,
  onhand: 0,
  transfer: 0,
  kredit: 0,
  tagih: 0,
});
const add = (t: DailyRecapAmounts, r: DailyRecapAmounts) => ({
  awb: t.awb + r.awb,
  onhand: t.onhand + r.onhand,
  transfer: t.transfer + r.transfer,
  kredit: t.kredit + r.kredit,
  tagih: t.tagih + r.tagih,
});

/** "REKAP" total: all four payment columns together, as the provider prints. */
export const recapMoney = (a: DailyRecapAmounts) =>
  a.onhand + a.transfer + a.kredit + a.tagih;

/** Group sorted lines by Kategori with SUB TOTAL and GRAND TOTAL. */
export function groupDailyRecap(lines: DailyRecapLine[]) {
  const groups: DailyRecapGroup[] = [];
  for (const line of lines) {
    let group = groups.find((g) => g.category === line.category);
    if (!group) {
      group = { category: line.category, lines: [], subtotal: zero() };
      groups.push(group);
    }
    group.lines.push(line);
    group.subtotal = add(group.subtotal, line);
  }
  return { groups, total: groups.reduce((t, g) => add(t, g.subtotal), zero()) };
}
