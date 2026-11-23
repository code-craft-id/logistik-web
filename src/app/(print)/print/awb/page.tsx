import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PrintToolbar } from "@/components/patterns/auto-print";
import { Barcode } from "@/components/patterns/barcode";
import { QrCode } from "@/components/patterns/qr-code";
import { isAdministrator } from "@/features/identity/permissions";
import { currentIdentity } from "@/features/identity/server/context";
import { requirePagePermission } from "@/lib/auth/page-access";
import { businessDateString } from "@/lib/date/business-date";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/db/generated/client";
import { formatRupiah } from "@/lib/format/rupiah";

export const metadata: Metadata = { title: "Print AWB" };

// Session-dependent document; blocking render.
export const instant = false;

const MAX = 100;

/** Provider layout (OBSERVED, newapps print.php): three copies per A4 page. */
const COPIES = ["SHIPPER", "OPERATIONAL", "BILLING"] as const;

const companySelect = {
  name: true,
  address: true,
  city: true,
  phoneNumber: true,
  website: true,
  logo: true,
  showPriceOnPrint: true,
} as const;

const printInclude = {
  originBranch: {
    select: {
      name: true,
      office: { select: { company: { select: companySelect } } },
    },
  },
  destinationBranch: { select: { name: true } },
  deliveryService: { select: { name: true } },
  costType: { select: { name: true } },
  pickupCourier: { select: { name: true } },
  createdBy: { select: { name: true } },
} satisfies Prisma.TransactionInclude;

type Decimalish = { toString(): string } | null | undefined;

/** "2026-11-23" -> "23/11/2026", the provider's print date format. */
function printDate(date: Date) {
  const [y, m, d] = businessDateString(date).split("-");
  return `${d}/${m}/${y}`;
}

function amount(value: Decimalish) {
  return value === null || value === undefined
    ? "0"
    : formatRupiah(value, { prefix: false });
}

function isNonZero(value: Decimalish) {
  return !!value && Number(value.toString()) !== 0;
}

/** Only render logos that are an inline image or an absolute http(s) URL. */
function logoSrc(logo: string | null | undefined) {
  if (!logo) return null;
  return /^data:image\/(png|jpe?g|webp);base64,/i.test(logo) ||
    /^https?:\/\//i.test(logo)
    ? logo
    : null;
}

/** Prints each AWB as one A4 page with SHIPPER/OPERATIONAL/BILLING copies. */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePagePermission("view", "transaction");
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const query = await searchParams;
  const raw = query.ids;
  // Provider print dialog (OBSERVED): "Harga" or "Non Harga" per print.
  // ?harga=0 hides prices; prices never show when the company disallows it.
  const withPrice = query.harga !== "0";
  const ids = [
    ...new Set(
      (Array.isArray(raw) ? raw : (raw ?? "").split(","))
        .map(Number)
        .filter((n) => Number.isSafeInteger(n) && n > 0),
    ),
  ].slice(0, MAX);
  const admin = isAdministrator(current.actor);
  const rows = ids.length
    ? await prisma.transaction.findMany({
        where: {
          id: { in: ids },
          deletedAt: null,
          ...(admin
            ? {}
            : {
                OR: [
                  { originBranchId: { in: current.actor.branchIds } },
                  { destinationBranchId: { in: current.actor.branchIds } },
                ],
              }),
        },
        include: printInclude,
      })
    : [];
  // Keep the order the user selected.
  const ordered = ids
    .map((id) => rows.find((r) => r.id === id))
    .filter((r): r is (typeof rows)[number] => !!r);
  if (!ordered.length)
    return (
      <p className="p-8 text-sm">
        Tidak ada AWB yang bisa dicetak. Pilih AWB di daftar Transaksi lalu klik
        Print terpilih. Hanya AWB dalam cabang Anda yang bisa dicetak.
      </p>
    );
  return (
    <>
      <PrintToolbar label="Cetak AWB" count={ordered.length} />
      <PriceChoice
        ids={ordered.map((tx) => tx.id)}
        withPrice={withPrice}
        preview={query.preview !== undefined}
      />
      <main className="space-y-6 p-4 print:space-y-0 print:p-0">
        {ordered.map((tx) => (
          <div
            key={tx.id}
            className="mx-auto max-w-[190mm] border border-neutral-300 bg-white px-4 print:max-w-none print:break-after-page print:border-0 print:px-0 print:last:break-after-auto"
          >
            {COPIES.map((copy, index) => (
              <AwbCopy
                key={copy}
                tx={tx}
                copy={copy}
                withPrice={withPrice}
                page={index + 1}
                last={index === COPIES.length - 1}
              />
            ))}
          </div>
        ))}
      </main>
    </>
  );
}

/** Screen-only switch between the provider's "Harga" and "Non Harga" prints. */
function PriceChoice({
  ids,
  withPrice,
  preview,
}: {
  ids: number[];
  withPrice: boolean;
  preview: boolean;
}) {
  const href = (harga: "1" | "0") =>
    `/print/awb?ids=${ids.join(",")}&harga=${harga}${preview ? "&preview=1" : ""}`;
  const option = (harga: "1" | "0", label: string, active: boolean) => (
    <a
      href={href(harga)}
      aria-current={active ? "true" : undefined}
      className={`inline-flex min-h-11 items-center rounded-md border px-4 text-sm ${
        active ? "border-primary bg-primary text-primary-foreground" : ""
      }`}
    >
      {label}
    </a>
  );
  return (
    <nav
      aria-label="Tipe print"
      className="flex flex-wrap items-center gap-2 px-4 pt-4 print:hidden"
    >
      <span className="text-sm">Tipe print:</span>
      {option("1", "Harga", withPrice)}
      {option("0", "Non Harga", !withPrice)}
    </nav>
  );
}

type PrintRow = Prisma.TransactionGetPayload<{
  include: typeof printInclude;
}>;

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0">
      <p className="font-bold">{label}</p>
      <p className="break-words">{value || "-"}</p>
    </div>
  );
}

function AwbCopy({
  tx,
  copy,
  withPrice,
  page,
  last,
}: {
  tx: PrintRow;
  copy: (typeof COPIES)[number];
  withPrice: boolean;
  page: number;
  last: boolean;
}) {
  const company = tx.originBranch?.office?.company;
  const logo = logoSrc(company?.logo);
  const awb = tx.awbNo ?? `ID ${tx.id}`;
  const koli = `${tx.koli ?? 0} C`;
  const kilo = `${tx.kilo?.toString() ?? "0"} Kg`;
  const volume = tx.volume?.toString() ?? "0";
  // Hidden when the print is "Non Harga", the AWB says no, or the company
  // disallows prices; an AWB without its own choice follows the company.
  const showPrice =
    withPrice &&
    tx.showPriceOnPrint !== false &&
    (company?.showPriceOnPrint ?? true);
  const priceLines: [string, string][] = [
    ["Harga/Kg", amount(tx.pricePerKg)],
    ["Packing", amount(tx.packingFee)],
    ["Asuransi", amount(tx.insuranceFee)],
    ...(isNonZero(tx.codFee)
      ? ([["COD", amount(tx.codFee)]] as [string, string][])
      : []),
    ["Lain-lain", amount(tx.otherFee)],
    ...(isNonZero(tx.pickupFee)
      ? ([["Pickup", amount(tx.pickupFee)]] as [string, string][])
      : []),
    ...(isNonZero(tx.discountPercent)
      ? ([["Diskon", `${tx.discountPercent} %`]] as [string, string][])
      : []),
    ...(isNonZero(tx.ppnPercent)
      ? ([["PPN", `${tx.ppnPercent} %`]] as [string, string][])
      : []),
  ];

  return (
    <section
      className={`relative break-inside-avoid py-2 pl-6 text-[10px] leading-tight ${
        last ? "" : "border-b border-dashed border-black"
      }`}
    >
      <p className="absolute top-1/2 left-0 origin-center -translate-y-1/2 rotate-180 text-[9px] tracking-wide [writing-mode:vertical-rl]">
        PAGE {page}/3 : {copy}
      </p>

      {/* Header: logo + office | AWB barcode */}
      <header className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="flex items-start gap-3">
          {logo && (
            // biome-ignore lint/performance/noImgElement: print-only inline company logo (data URL)
            <img
              src={logo}
              alt={company?.name ?? "Logo"}
              className="h-12 w-12 shrink-0 object-contain"
            />
          )}
          <div>
            <p className="font-bold">{company?.name ?? "Kantor"}</p>
            {company?.address && <p>{company.address}</p>}
            {company?.city && <p>{company.city}</p>}
            {company?.phoneNumber && <p>Telp. {company.phoneNumber}</p>}
            {company?.website && <p>{company.website}</p>}
          </div>
        </div>
        <div className="w-60 text-center">
          <p className="font-bold">Nomor AWB</p>
          {tx.awbNo ? (
            <Barcode
              value={tx.awbNo}
              className="[&_figcaption]:text-sm [&_figcaption]:font-bold [&_svg]:h-10"
            />
          ) : (
            <p className="font-mono text-sm font-bold">{awb}</p>
          )}
        </div>
      </header>

      <div className="mt-1 grid grid-cols-[53fr_47fr] gap-3">
        {/* Left: parties | origin, pieces, QR; then signatures and terms */}
        <div className="flex flex-col gap-1.5">
          <div className="grid grid-cols-[1fr_7.5rem] gap-2">
            <div className="space-y-1.5">
              <div>
                <p className="font-bold">Shipper/Pengirim :</p>
                <p>{tx.senderName || "-"}</p>
                {tx.senderAddress && <p>{tx.senderAddress}</p>}
                <p>PHONE/TELP No. {tx.senderPhone || "-"}</p>
              </div>
              <div>
                <p className="font-bold">Consignee/Penerima :</p>
                <p>{tx.receiverName || "-"}</p>
                {tx.receiverAddress && <p>{tx.receiverAddress}</p>}
                <p>PHONE/TELP No. {tx.receiverPhone || "-"}</p>
              </div>
            </div>
            <div className="space-y-1">
              <Field label="Origin" value={tx.originBranch?.name} />
              <Field label="Pieces" value={koli} />
              <div className="flex flex-col items-center text-center">
                <p className="text-[8px] font-bold">Scan me for tracking</p>
                <QrCode value={tx.awbNo ?? `AWB-ID-${tx.id}`} size={64} />
                <p className="text-[8px] font-bold uppercase">
                  {tx.deliveryService?.name ?? ""}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-auto grid grid-cols-[1fr_1fr_9.5rem] gap-2">
            <div>
              <p className="font-bold">Shipper Sign</p>
              <div className="h-7" />
              <p className="font-bold">
                Date : {printDate(tx.transactionDate)}
              </p>
              <p className="font-bold">Name &amp; Stamp</p>
            </div>
            <div>
              <p className="font-bold">Receiver Sign</p>
              <div className="h-7" />
              <p className="font-bold">Date :</p>
              <p className="font-bold">Name &amp; Stamp</p>
            </div>
            <div className="flex flex-col">
              <p className="text-center text-[8px] leading-tight">
                Dengan menyerahkan kiriman, Anda setuju dengan ketentuan dan
                kondisi pada nota pengiriman ini tanpa syarat
                {company?.website
                  ? `, termasuk ketentuan dan kondisi yang tertera pada halaman website ${company.website}`
                  : ""}
                .
              </p>
              <p className="mt-auto font-bold">
                Pickup By/Diambil oleh : {tx.pickupCourier?.name ?? ""}
              </p>
              <p className="font-bold">Date/Time :</p>
            </div>
          </div>
        </div>

        {/* Right: shipment facts, detail and price box */}
        <div className="flex flex-col gap-1.5">
          <div className="grid grid-cols-[2fr_1fr] gap-2">
            <Field label="Destination" value={tx.destinationBranch?.name} />
            <Field label="No. Reff" value={tx.doNo} />
          </div>
          <div className="grid grid-cols-4 gap-2">
            <Field label="Weight" value={kilo} />
            <Field label="Volume" value={volume} />
            <Field label="Payment" value={tx.costType?.name} />
            <Field label="Service" value={tx.deliveryService?.name} />
          </div>
          <div className="grid grid-cols-[2fr_3fr] border border-black">
            <div className="space-y-0.5 border-r border-black p-1.5 text-[11px]">
              <p>Detail :</p>
              <p>Koli : {koli}</p>
              <p>Kilo : {kilo}</p>
              <p>Volume : {volume}</p>
              {tx.chargeableWeight && (
                <p>Terberat : {tx.chargeableWeight.toString()} Kg</p>
              )}
              {/* COD is collected from the receiver, so it prints even on a
                  "Non Harga" print. */}
              {isNonZero(tx.codValue) && (
                <p className="font-bold">COD : Rp. {amount(tx.codValue)}</p>
              )}
            </div>
            <div className="flex flex-col p-1.5">
              <p>Declare Value/Nilai Kiriman :</p>
              <dl className="mt-0.5">
                {priceLines.map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[4.5rem_2rem_1fr]">
                    <dt>{label}</dt>
                    <dd>: Rp.</dd>
                    <dd className="text-right">{showPrice ? value : ""}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-auto grid grid-cols-[4.5rem_2rem_1fr] border-t border-black pt-0.5">
                <span className="pl-4">Total</span>
                <span>: Rp.</span>
                <span className="text-right font-bold">
                  {showPrice ? amount(tx.biaya) : ""}
                </span>
              </div>
            </div>
          </div>
          <div>
            <p className="font-bold">
              Description of Shipment/Keterangan isi Kiriman :
            </p>
            <p>{tx.description || "-"}</p>
            <p className="font-bold">Special Instruction/Instruksi Khusus :</p>
            <p className="text-red-600 print:text-red-600">
              {tx.remarks || "-"}
            </p>
          </div>
          <p className="text-center text-[9px]">
            Create by : {tx.createdBy?.name ?? "-"}
          </p>
        </div>
      </div>
    </section>
  );
}
