/** Business calendar used for operational dates in the LMS. */
export const BUSINESS_TIME_ZONE = "Asia/Jakarta";

const BUSINESS_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const BUSINESS_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("sv-SE", {
  timeZone: BUSINESS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function businessDateString(date = new Date()): string {
  const parts = BUSINESS_DATE_FORMATTER.formatToParts(date);
  const get = (type: "year" | "month" | "day") =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function businessYearMonth(date = new Date()): {
  year: number;
  month: number;
} {
  const parts = BUSINESS_DATE_FORMATTER.formatToParts(date);
  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
  };
}

/** Format an instant for users without changing its UTC storage/transport form. */
export function businessDateTimeString(date: Date | string | null | undefined) {
  if (date == null) return "";
  const instant = date instanceof Date ? date : new Date(date);
  if (!Number.isFinite(instant.getTime())) return "";
  const parts = BUSINESS_DATE_TIME_FORMATTER.formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

/** Convert a valid YYYY-MM-DD business date to its Jakarta midnight instant. */
export function businessDateStartUtc(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new RangeError("Invalid business date");
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    throw new RangeError("Invalid business date");
  return new Date(date.getTime() - 7 * 60 * 60 * 1000);
}

/** Convert the day after an inclusive Jakarta business date to a UTC instant. */
export function businessDateAfterUtc(value: string): Date {
  const start = businessDateStartUtc(value);
  return new Date(start.getTime() + 86_400_000);
}

/** UTC epoch for the start of a calendar day, using an ISO date-only value. */
export function dateOnlyEpoch(value: string): number {
  return Date.parse(`${value}T00:00:00.000Z`);
}

/** The UTC instant when the given Jakarta calendar month begins. */
export function jakartaMonthStartUtc(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1) - 7 * 60 * 60 * 1000);
}
