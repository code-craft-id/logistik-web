/**
 * Rule-based dashboard summary like the provider "AI Executive Insight"
 * (OBSERVED redlogistik 2026-11-26: "Rule-Based Insight"). Status buckets
 * map stored AWB statuses: Delivered = success, In Transit = on delivery,
 * Returned = failed / return, Open = pending (OBSERVED, not CONFIRMED).
 */
export type StatusBuckets = {
  total: number;
  success: number;
  onDelivery: number;
  failedReturn: number;
  pending: number;
  other: number;
};

const BUCKET: Record<string, keyof Omit<StatusBuckets, "total">> = {
  Delivered: "success",
  "In Transit": "onDelivery",
  Returned: "failedReturn",
  Open: "pending",
};

export function statusBuckets(
  statuses: { status: string; count: number }[],
): StatusBuckets {
  const b: StatusBuckets = {
    total: 0,
    success: 0,
    onDelivery: 0,
    failedReturn: 0,
    pending: 0,
    other: 0,
  };
  for (const row of statuses) {
    b.total += row.count;
    b[BUCKET[row.status] ?? "other"] += row.count;
  }
  return b;
}

/** Percent change vs the previous period; null when there is no base. */
export function changePercent(
  current: string | number,
  previous: string | number,
): number | null {
  const now = Number(current);
  const before = Number(previous);
  if (!before) return null;
  return ((now - before) / before) * 100;
}

export const percent = (part: number, whole: number) =>
  whole ? (part / whole) * 100 : 0;

const pct = (v: number) =>
  `${v.toLocaleString("id-ID", { maximumFractionDigits: 2 })}%`;

export function executiveSummary(input: {
  buckets: StatusBuckets;
  awbPending: number;
  podOutstanding: number;
  invoicesOutstanding: number | null;
  amountText: string | null;
  topCustomer: { name: string; amountText: string } | null;
}) {
  const { buckets: b } = input;
  const success = percent(b.success, b.total);
  const lines: string[] = [];
  if (input.amountText !== null)
    lines.push(
      `Total transaksi periode ini ${input.amountText} dari ${b.total} AWB.`,
    );
  else lines.push(`Total ${b.total} AWB dalam periode ini.`);
  if (b.total) lines.push(`Delivery success mencapai ${pct(success)}.`);
  if (input.awbPending)
    lines.push(
      `${input.awbPending} AWB belum masuk manifest (AWB Pending) perlu dipantau.`,
    );
  if (b.failedReturn)
    lines.push(`${b.failedReturn} AWB berstatus gagal / retur.`);
  if (input.topCustomer)
    lines.push(
      `Customer tertinggi periode ini adalah ${input.topCustomer.name} dengan revenue ${input.topCustomer.amountText}.`,
    );

  const recommendations: string[] = [];
  if (input.podOutstanding)
    recommendations.push(
      `Prioritaskan follow up ${input.podOutstanding} POD outstanding.`,
    );
  if (input.awbPending)
    recommendations.push(
      "Monitor AWB pending agar segera masuk manifest dan tidak melewati SLA.",
    );
  if (b.total && success < 50)
    recommendations.push(
      "Evaluasi proses delivery karena success rate masih di bawah 50%.",
    );
  if (b.failedReturn)
    recommendations.push("Cek penyebab AWB gagal / retur bersama kurir.");
  if (input.invoicesOutstanding)
    recommendations.push(
      `Tagih ${input.invoicesOutstanding} invoice yang belum lunas.`,
    );
  if (!recommendations.length)
    recommendations.push("Tidak ada tindakan mendesak untuk periode ini.");
  return { lines, recommendations };
}
