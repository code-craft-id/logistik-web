/** Business calendar used for operational dates in the LMS. */
export const BUSINESS_TIME_ZONE = "Asia/Jakarta";

export function businessDateString(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: "year" | "month" | "day") =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** UTC epoch for the start of a calendar day, using an ISO date-only value. */
export function dateOnlyEpoch(value: string): number {
  return Date.parse(`${value}T00:00:00.000Z`);
}

/** The UTC instant when the given Jakarta calendar month begins. */
export function jakartaMonthStartUtc(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1) - 7 * 60 * 60 * 1000);
}
