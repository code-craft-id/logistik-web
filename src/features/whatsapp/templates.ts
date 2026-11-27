import { z } from "zod";

/**
 * Provider "Pesan Whatsapp" (OBSERVED Perusahaan > WA Notifikasi, D-37).
 * Four messages, each with a fixed recipient and an on/off switch.
 */
export const WHATSAPP_KINDS = [
  "TRX_SENDER",
  "TRX_RECEIVER",
  "SHIPMENT_STATUS",
  "DELIVERY_SHEET",
] as const;
export type WhatsAppKind = (typeof WHATSAPP_KINDS)[number];

const FOOTER =
  "terimakasih. {namaPerusahaan}\n\nMohon untuk tidak membalas pesan otomatis ini";

export const WHATSAPP_TEMPLATE_INFO: Record<
  WhatsAppKind,
  {
    tab: string;
    title: string;
    recipient: "sender" | "receiver";
    recipientLabel: string;
    trigger: string;
    variables: string[];
    defaultMessage: string;
  }
> = {
  TRX_SENDER: {
    tab: "Message WA Transaksi",
    title: "Message WA Transaksi Pengirim",
    recipient: "sender",
    recipientLabel: "Pengirim Transaksi",
    trigger: "Saat AWB baru disimpan (Entry AWB).",
    variables: [
      "namaPengirim",
      "awb",
      "alamatPenerima",
      "cabangTujuan",
      "tglKonos",
      "namaPerusahaan",
    ],
    defaultMessage: `Dear {namaPengirim}, Kiriman anda dengan AWB No. {awb} dengan tujuan {alamatPenerima}, {cabangTujuan}, sudah diproses pada tanggal {tglKonos}, ${FOOTER}`,
  },
  TRX_RECEIVER: {
    tab: "Message WA Transaksi",
    title: "Message WA Transaksi Penerima",
    recipient: "receiver",
    recipientLabel: "Penerima Transaksi",
    trigger: "Saat AWB baru disimpan (Entry AWB).",
    variables: [
      "namaPenerima",
      "awb",
      "namaPengirim",
      "alamatPengirim",
      "cabangAsal",
      "tglKonos",
      "namaPerusahaan",
    ],
    defaultMessage: `Dear {namaPenerima}, Kiriman anda dengan AWB No. {awb} dari {namaPengirim}, {alamatPengirim}, {cabangAsal}, sudah diproses pada tanggal {tglKonos}, ${FOOTER}`,
  },
  SHIPMENT_STATUS: {
    tab: "Message WA Shipment Status",
    title: "Message WA Shipment Status",
    recipient: "sender",
    recipientLabel: "Pengirim Transaksi",
    trigger: "Saat status AWB menjadi Delivered (diterima).",
    variables: [
      "namaPengirim",
      "awb",
      "alamatPenerima",
      "cabangTujuan",
      "diterima",
      "tglDiterima",
      "jamDiterima",
      "namaPerusahaan",
    ],
    defaultMessage: `Dear {namaPengirim}, Kiriman anda dengan AWB No. {awb} Tujuan {alamatPenerima}, {cabangTujuan}, sudah di terima oleh {diterima} pada tanggal {tglDiterima}, pukul {jamDiterima}, ${FOOTER}`,
  },
  DELIVERY_SHEET: {
    tab: "Message WA Delivery Sheet",
    title: "Message WA Delivery Sheet",
    recipient: "receiver",
    recipientLabel: "Penerima Transaksi",
    trigger: "Saat AWB masuk Delivery Sheet / DRS (dibawa kurir).",
    variables: [
      "namaPenerima",
      "awb",
      "alamatPenerima",
      "cabangTujuan",
      "namaKurir",
      "tglDiterima",
      "namaPerusahaan",
    ],
    defaultMessage: `Dear {namaPenerima}, \nKiriman anda dengan Resi No. {awb} \n\nTujuan {alamatPenerima}, {cabangTujuan}.\n\nStatus ondelivery hari ini {tglDiterima}\n\n${FOOTER}`,
  },
};

export const whatsappTemplateInput = z.strictObject({
  kind: z.enum(WHATSAPP_KINDS),
  message: z.string().trim().min(1, "Pesan wajib diisi.").max(2000),
  isEnabled: z.boolean(),
});

/**
 * Replace `{variable}` with its value; unknown variables stay as typed. The
 * provider stores line breaks as a literal `\n`, so both forms become a
 * newline.
 */
export function renderWhatsAppMessage(
  template: string,
  values: Record<string, string | null | undefined>,
) {
  return template
    .replace(/\\n/g, "\n")
    .replace(/\{([A-Za-z]+)\}/g, (whole, name: string) =>
      Object.hasOwn(values, name) ? (values[name] ?? "-").trim() || "-" : whole,
    )
    .trim();
}

/**
 * Indonesian phone to E.164 (`08…`, `8…`, `62…`, `+62…`); null when it cannot
 * be a WhatsApp number. Only the first number of a list is used.
 */
export function toWhatsAppNumber(phone: string | null | undefined) {
  const first = (phone ?? "").split(/[,;/]/)[0] ?? "";
  let digits = first.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  else if (digits.startsWith("8")) digits = `62${digits}`;
  return /^[1-9]\d{9,14}$/.test(digits) ? `+${digits}` : null;
}

const JAKARTA = "Asia/Jakarta";
/** dd-mm-yyyy in Asia/Jakarta (business time zone). */
export function formatWhatsAppDate(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: JAKARTA,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get("day")}-${get("month")}-${get("year")}`;
}
/** HH:mm in Asia/Jakarta. */
export function formatWhatsAppTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: JAKARTA,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
