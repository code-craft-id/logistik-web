/**
 * Indonesian Rupiah display: "Rp 121.250" or "Rp 1.250,50". Works on the
 * decimal string so database Decimal values are never rounded through
 * floating point. Returns "-" for empty values.
 */
export function formatRupiah(
  value: string | number | { toString(): string } | null | undefined,
  { prefix = true }: { prefix?: boolean } = {},
) {
  if (value === null || value === undefined || value === "") return "-";
  const text = typeof value === "number" ? String(value) : value.toString();
  const match = /^(-)?(\d+)(?:\.(\d+))?$/.exec(text.trim());
  if (!match) return text;
  const [, sign = "", whole, fraction = ""] = match;
  const grouped = whole
    .replace(/^0+(?=\d)/, "")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const cents = fraction.replace(/0+$/, "");
  const amount = `${sign}${grouped}${cents ? `,${cents.padEnd(2, "0")}` : ""}`;
  return prefix ? `Rp ${amount}` : amount;
}
