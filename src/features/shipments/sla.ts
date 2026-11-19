/**
 * SLA target in days from a Cek Ongkir "Estimasi" text: the largest number,
 * so "1-2 hari" → 2 (owner decision 2026-11-19). Null when there is none.
 */
export function slaTargetDays(eta: string | null): number | null {
  const numbers = (eta ?? "").match(/\d+/g)?.map(Number) ?? [];
  return numbers.length ? Math.max(...numbers) : null;
}

/** SLA label: In Progress until received, then On Time / Late vs target. */
export function slaLabel(
  leadTimeDays: number | null,
  targetDays: number | null,
  status: string,
) {
  if (status === "Returned") return "Retur";
  if (leadTimeDays === null && status !== "Delivered") return "In Progress";
  if (leadTimeDays === null || targetDays === null) return "-";
  return leadTimeDays <= targetDays ? "On Time" : "Late";
}
