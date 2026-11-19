/**
 * Fields an operator must fill on the Entry AWB and Tambah Booking forms.
 * Product choice (2026-11-19, owner request): what is needed to ship and
 * bill an AWB, and to pick up a booking. Checked by the form actions on the
 * server; the forms mark the same fields with * and `required`.
 */
type Raw = Record<string, unknown>;
const filled = (v: unknown) => typeof v === "string" && v.trim() !== "";
const positive = (v: unknown) => filled(v) && Number(v) > 0;

const awbRules: [string, string, (v: unknown) => boolean][] = [
  ["originBranchId", "Asal", filled],
  ["destinationBranchId", "Tujuan", filled],
  ["senderName", "Nama Pengirim", filled],
  ["receiverName", "Nama Penerima", filled],
  ["receiverAddress", "Alamat Penerima", filled],
  ["receiverPhone", "No. Telp Penerima", filled],
  ["deliveryServiceId", "Layanan", filled],
  ["costTypeId", "Pembayaran", filled],
  ["koli", "Koli (minimal 1)", positive],
  ["kilo", "Berat (Kg)", positive],
];

const bookingRules: [string, string, (v: unknown) => boolean][] = [
  ["branchId", "Asal", filled],
  ["destinationBranchId", "Tujuan", filled],
  ["senderName", "Nama Pengirim", filled],
  ["senderAddress", "Alamat Pengirim", filled],
  ["senderPhone", "No. Telp Pengirim", filled],
  ["koli", "Koli (minimal 1)", positive],
];

const missing = (rules: typeof awbRules, raw: Raw) =>
  rules.filter(([key, , ok]) => !ok(raw[key])).map(([, label]) => label);

/** Labels of required AWB fields that are empty. */
export const missingAwbFields = (raw: Raw) => missing(awbRules, raw);
/** Labels of required booking fields that are empty. */
export const missingBookingFields = (raw: Raw) => missing(bookingRules, raw);
