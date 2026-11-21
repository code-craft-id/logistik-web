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
import { formatRupiah } from "@/lib/format/rupiah";

export const metadata: Metadata = { title: "Print AWB" };

// Session-dependent document; blocking render.
export const instant = false;

const MAX = 100;

/** Prints one AWB label per page for ?ids=1&ids=2 (max 100, branch-scoped). */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePagePermission("view", "transaction");
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const raw = (await searchParams).ids;
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
        include: {
          originBranch: {
            select: {
              name: true,
              office: {
                select: {
                  company: {
                    select: {
                      name: true,
                      address: true,
                      city: true,
                      phoneNumber: true,
                      showPriceOnPrint: true,
                    },
                  },
                },
              },
            },
          },
          destinationBranch: { select: { name: true } },
          customer: { select: { name: true } },
          deliveryService: { select: { name: true } },
          transportMode: { select: { name: true } },
          goodsType: { select: { name: true } },
          costType: { select: { name: true } },
        },
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
      <main className="space-y-6 p-4 print:space-y-0 print:p-0">
        {ordered.map((tx) => {
          const company = tx.originBranch?.office?.company;
          return (
            <article
              key={tx.id}
              className="mx-auto max-w-[190mm] break-inside-avoid border border-black p-4 print:break-after-page print:last:break-after-auto"
            >
              <header className="flex items-start justify-between gap-4 border-b border-black pb-3">
                <div>
                  {company && (
                    <div className="mb-2 text-xs">
                      <p className="text-base font-bold">{company.name}</p>
                      <p>
                        {[company.address, company.city]
                          .filter(Boolean)
                          .join(", ")}
                        {company.phoneNumber
                          ? ` · Telp ${company.phoneNumber}`
                          : ""}
                      </p>
                    </div>
                  )}
                  <h1 className="text-lg font-bold">RESI PENGIRIMAN (AWB)</h1>
                  <p className="text-sm">
                    {businessDateString(tx.transactionDate)} · {tx.status}
                  </p>
                  <p className="mt-2 font-mono text-xl font-bold tracking-widest">
                    {tx.awbNo ?? `ID ${tx.id}`}
                  </p>
                </div>
                <div className="flex items-end gap-3">
                  {tx.awbNo && <Barcode value={tx.awbNo} className="w-56" />}
                  <QrCode value={tx.awbNo ?? `AWB-ID-${tx.id}`} size={88} />
                </div>
              </header>
              <section className="grid grid-cols-2 gap-4 border-b border-black py-3 text-sm">
                <div>
                  <h2 className="font-bold">PENGIRIM</h2>
                  <p>{tx.senderName ?? "-"}</p>
                  {tx.senderAddress && <p>{tx.senderAddress}</p>}
                  {tx.senderPhone && <p>Telp: {tx.senderPhone}</p>}
                  <p>Asal: {tx.originBranch?.name ?? "-"}</p>
                </div>
                <div>
                  <h2 className="font-bold">PENERIMA</h2>
                  <p>{tx.receiverName ?? "-"}</p>
                  {tx.receiverAddress && <p>{tx.receiverAddress}</p>}
                  {tx.receiverPhone && <p>Telp: {tx.receiverPhone}</p>}
                  <p>Tujuan: {tx.destinationBranch?.name ?? "-"}</p>
                </div>
              </section>
              <dl className="grid grid-cols-4 gap-x-4 gap-y-1 py-3 text-xs">
                {(
                  [
                    ["Customer", tx.customer?.name],
                    ["DO / Reff", tx.doNo],
                    ["Layanan", tx.deliveryService?.name],
                    ["Moda", tx.transportMode?.name],
                    ["DOC / PAC", tx.goodsType?.name],
                    ["Pembayaran", tx.costType?.name],
                    ["Koli", tx.koli],
                    ["Berat (kg)", tx.kilo?.toString()],
                    ["Volume", tx.volume?.toString()],
                    ["Terberat (kg)", tx.chargeableWeight?.toString()],
                    ...(company?.showPriceOnPrint
                      ? ([["Biaya", formatRupiah(tx.biaya)]] as const)
                      : []),
                    ["Isi Barang", tx.description],
                    ["Keterangan", tx.remarks],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label}>
                    <dt className="font-semibold">{label}</dt>
                    <dd>{value ?? "-"}</dd>
                  </div>
                ))}
              </dl>
              <footer className="grid grid-cols-2 gap-6 pt-6 text-center text-xs">
                <p className="border-t border-black pt-1">
                  Tanda tangan pengirim
                </p>
                <p className="border-t border-black pt-1">
                  Tanda tangan penerima
                </p>
              </footer>
            </article>
          );
        })}
      </main>
    </>
  );
}
