import type { Metadata } from "next";
import { PrintToolbar } from "@/components/patterns/auto-print";
import { Barcode } from "@/components/patterns/barcode";
import { QrCode } from "@/components/patterns/qr-code";
import { isAdministrator } from "@/features/identity/permissions";
import { requirePagePermission } from "@/lib/auth/page-access";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Print Label Koli" };

// Session-dependent document; blocking render.
export const instant = false;

const MAX_AWB = 50;
const MAX_LABELS = 500;

/**
 * One label per koli for ?ids=1&ids=2: number AWB-n (as in the provider's
 * AWB pending list), "Koli n dari N", Code 128 and QR of the koli number.
 * Scanning a koli label resolves to its AWB.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const current = await requirePagePermission("view", "transaction");
  const raw = (await searchParams).ids;
  const ids = [
    ...new Set(
      (Array.isArray(raw) ? raw : (raw ?? "").split(","))
        .map(Number)
        .filter((n) => Number.isSafeInteger(n) && n > 0),
    ),
  ].slice(0, MAX_AWB);
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
        select: {
          id: true,
          awbNo: true,
          koli: true,
          kilo: true,
          transactionDate: true,
          senderName: true,
          receiverName: true,
          receiverAddress: true,
          receiverPhone: true,
          originBranch: {
            select: {
              name: true,
              office: { select: { company: { select: { name: true } } } },
            },
          },
          destinationBranch: { select: { name: true } },
          transportMode: { select: { name: true } },
        },
      })
    : [];
  const ordered = ids
    .map((id) => rows.find((r) => r.id === id))
    .filter((r): r is (typeof rows)[number] => !!r);
  const labels = ordered
    .flatMap((tx) => {
      const total = Math.max(1, tx.koli ?? 1);
      const awbNo = tx.awbNo ?? `ID${tx.id}`;
      return Array.from({ length: total }, (_, i) => ({
        tx,
        awbNo,
        number: `${awbNo}-${i + 1}`,
        index: i + 1,
        total,
      }));
    })
    .slice(0, MAX_LABELS);
  if (!labels.length)
    return (
      <p className="p-8 text-sm">
        Tidak ada label koli yang bisa dicetak. Pilih AWB di daftar Transaksi
        lalu klik Print label koli. Hanya AWB dalam cabang Anda yang bisa
        dicetak.
      </p>
    );
  return (
    <>
      <PrintToolbar label="Cetak label koli" count={labels.length} />
      <main className="space-y-4 p-4 print:space-y-0 print:p-0">
        {labels.map(({ tx, awbNo, number, index, total }) => (
          <article
            key={number}
            className="mx-auto max-w-[105mm] break-inside-avoid border border-black p-3 text-sm print:break-after-page print:last:break-after-auto"
          >
            <header className="flex items-start justify-between gap-2 border-b border-black pb-2">
              <div className="min-w-0">
                <p className="text-xs font-bold">
                  {tx.originBranch?.office?.company?.name ?? "LABEL KOLI"}
                </p>
                <p className="font-mono text-lg font-bold">{number}</p>
                <p className="text-xs">
                  AWB {awbNo} · Koli {index} dari {total}
                </p>
              </div>
              <p className="shrink-0 rounded border border-black px-2 py-1 text-base font-bold">
                {index}/{total}
              </p>
            </header>
            <div className="flex items-end justify-between gap-2 border-b border-black py-2">
              <Barcode value={number} className="w-52" />
              <QrCode value={number} size={72} />
            </div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 pt-2 text-xs">
              <div>
                <dt className="font-semibold">Asal</dt>
                <dd>{tx.originBranch?.name ?? "-"}</dd>
              </div>
              <div>
                <dt className="font-semibold">Tujuan</dt>
                <dd className="text-base font-bold">
                  {tx.destinationBranch?.name ?? "-"}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="font-semibold">Penerima</dt>
                <dd>
                  {tx.receiverName ?? "-"}
                  {tx.receiverPhone ? ` · ${tx.receiverPhone}` : ""}
                </dd>
                {tx.receiverAddress && <dd>{tx.receiverAddress}</dd>}
              </div>
              <div>
                <dt className="font-semibold">Pengirim</dt>
                <dd>{tx.senderName ?? "-"}</dd>
              </div>
              <div>
                <dt className="font-semibold">Tanggal · Moda</dt>
                <dd>
                  {tx.transactionDate.toISOString().slice(0, 10)} ·{" "}
                  {tx.transportMode?.name ?? "-"}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </main>
    </>
  );
}
