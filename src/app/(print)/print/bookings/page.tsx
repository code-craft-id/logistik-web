import type { Metadata } from "next";
import { PrintToolbar } from "@/components/patterns/auto-print";
import { Barcode } from "@/components/patterns/barcode";
import { QrCode } from "@/components/patterns/qr-code";
import { isAdministrator } from "@/features/identity/permissions";
import { requirePagePermission } from "@/lib/auth/page-access";
import { prisma } from "@/lib/db";
import { formatRupiah } from "@/lib/format/rupiah";

export const metadata: Metadata = { title: "Print Booking" };

// Session-dependent document; blocking render.
export const instant = false;

const MAX = 100;

/** One booking slip per page with barcode and QR for ?ids=1&ids=2 (branch-scoped). */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const current = await requirePagePermission("view", "booking");
  const raw = (await searchParams).ids;
  const ids = [
    ...new Set(
      (Array.isArray(raw) ? raw : (raw ?? "").split(","))
        .map(Number)
        .filter((n) => Number.isSafeInteger(n) && n > 0),
    ),
  ].slice(0, MAX);
  const rows = ids.length
    ? await prisma.booking.findMany({
        where: {
          id: { in: ids },
          deletedAt: null,
          ...(isAdministrator(current.actor)
            ? {}
            : { branchId: { in: current.actor.branchIds } }),
        },
        include: {
          customer: { select: { name: true } },
          branch: {
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
                    },
                  },
                },
              },
            },
          },
        },
      })
    : [];
  const ordered = ids
    .map((id) => rows.find((r) => r.id === id))
    .filter((r): r is (typeof rows)[number] => !!r);
  if (!ordered.length)
    return (
      <p className="p-8 text-sm">
        Tidak ada booking yang bisa dicetak. Pilih booking di daftar Booking
        lalu klik Print terpilih. Hanya booking cabang Anda yang bisa dicetak.
      </p>
    );
  return (
    <>
      <PrintToolbar label="Cetak Booking" count={ordered.length} />
      <main className="space-y-6 p-4 print:space-y-0 print:p-0">
        {ordered.map((b) => {
          const company = b.branch?.office?.company;
          const code = b.bookingNo ?? `BOOKING-${b.id}`;
          return (
            <article
              key={b.id}
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
                  <h1 className="text-lg font-bold">BOOKING PICKUP</h1>
                  <p className="text-sm">
                    {b.bookingDate.toISOString().slice(0, 10)} · {b.status} ·
                    Cabang {b.branch?.name ?? "-"}
                  </p>
                  <p className="mt-2 font-mono text-xl font-bold tracking-widest">
                    {code}
                  </p>
                </div>
                <div className="flex items-end gap-3">
                  <Barcode value={code} className="w-56" />
                  <QrCode value={code} size={88} />
                </div>
              </header>
              <dl className="grid grid-cols-3 gap-x-4 gap-y-1 py-3 text-sm">
                {(
                  [
                    ["Customer", b.customer?.name],
                    ["Pengirim", b.senderName],
                    ["Penerima", b.receiverName],
                    ["Tujuan", b.destination],
                    ["DO / Reff", b.doNo],
                    ["Koli", b.koli],
                    ["Berat (kg)", b.kilo?.toString()],
                    ["Volume", b.volume?.toString()],
                    ["Biaya", b.biaya ? formatRupiah(b.biaya) : null],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label}>
                    <dt className="font-semibold">{label}</dt>
                    <dd>{value ?? "-"}</dd>
                  </div>
                ))}
              </dl>
              <footer className="grid grid-cols-2 gap-6 pt-6 text-center text-xs">
                <p className="border-t border-black pt-1">Kurir pickup</p>
                <p className="border-t border-black pt-1">Pengirim</p>
              </footer>
            </article>
          );
        })}
      </main>
    </>
  );
}
