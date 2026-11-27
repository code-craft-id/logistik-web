import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PrintToolbar } from "@/components/patterns/auto-print";
import { IdentityError } from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";
import {
  type DailyRecapAmounts,
  recapMoney,
} from "@/features/reports/recap/daily-recap-groups";
import { dailyTransactionRecap } from "@/features/reports/recap/server/daily-recap";
import { requirePagePermission } from "@/lib/auth/page-access";
import { formatRupiah } from "@/lib/format/rupiah";

export const metadata: Metadata = { title: "Rekap Transaksi Harian" };

// Session-dependent document; blocking render.
export const instant = false;

const cell = "border border-black px-1 py-0.5";
const num = `${cell} text-right`;
const rp = (n: number) => formatRupiah(n, { prefix: false });

function Amounts({ a }: { a: DailyRecapAmounts }) {
  return (
    <>
      <td className={`${cell} text-center`}>{a.awb}</td>
      <td className={num}>{rp(a.onhand)}</td>
      <td className={num}>{rp(a.transfer)}</td>
      <td className={num}>{rp(a.kredit)}</td>
      <td className={num}>{rp(a.tagih)}</td>
    </>
  );
}

function Rekap({
  label,
  a,
  count = false,
}: {
  label: string;
  a: DailyRecapAmounts;
  count?: boolean;
}) {
  return (
    <tr>
      <td className={`${cell} text-center`} colSpan={2}>
        {label}
      </td>
      <td className={`${cell} text-center`}>{count ? a.awb : ""}</td>
      <td className={`${cell} text-center`} colSpan={4}>
        {rp(recapMoney(a))}
      </td>
      <td className={cell} colSpan={2} />
    </tr>
  );
}

/** Printable Rekap Transaksi Harian for ?date=YYYY-MM-DD&branchId=N. */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePagePermission("view", "transaction_report");
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const query = await searchParams;
  let recap: Awaited<ReturnType<typeof dailyTransactionRecap>>;
  try {
    recap = await dailyTransactionRecap(current.actor, query);
  } catch (error) {
    if (!(error instanceof IdentityError)) throw error;
    return (
      <p className="p-8 text-sm">
        Rekap tidak bisa dicetak: pilih Tanggal yang valid dan Cabang yang boleh
        Anda akses, lalu klik Cetak lagi.
      </p>
    );
  }
  return (
    <>
      <PrintToolbar label="Cetak Rekap" count={1} />
      <main className="p-4 print:p-0">
        <article className="mx-auto max-w-4xl space-y-3 text-xs">
          <header className="text-center">
            <h1 className="text-base font-bold">Rekap Transaksi Harian</h1>
            <p>Cabang : {recap.branch}</p>
          </header>
          <p>Tanggal : {recap.date}</p>
          <p>PENDAPATAN</p>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {[
                  "Kategori",
                  "Kiriman Via",
                  "Total Resi",
                  "Tunai-Onhand",
                  "Tunai-Transfer",
                  "Kredit",
                  "Tagih Tujuan",
                  "CS",
                  "Keterangan",
                ].map((h) => (
                  <th key={h} className={`${cell} font-normal`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recap.groups.length === 0 && (
                <tr>
                  <td className={`${cell} text-center`} colSpan={9}>
                    Tidak ada AWB pada tanggal ini.
                  </td>
                </tr>
              )}
              {recap.groups.map((g) => (
                <GroupRows key={g.category} group={g} />
              ))}
              <tr className="bg-neutral-400 print:bg-neutral-400">
                <td className={`${cell} text-center`} colSpan={2}>
                  GRAND TOTAL
                </td>
                <Amounts a={recap.total} />
                <td className={cell} colSpan={2} />
              </tr>
              <Rekap label="REKAP GRAND TOTAL" a={recap.total} count />
            </tbody>
          </table>
          <footer className="grid grid-cols-3 gap-4 pt-6 text-center">
            <p>Di buat oleh,</p>
            <p>Di periksa oleh,</p>
            <p>Mengetahui,</p>
            <p className="pt-14">{current.session.user.name}</p>
            <p className="pt-14">-</p>
            <p className="pt-14">-</p>
          </footer>
        </article>
      </main>
    </>
  );
}

function GroupRows({
  group,
}: {
  group: Awaited<ReturnType<typeof dailyTransactionRecap>>["groups"][number];
}) {
  return (
    <>
      {group.lines.map((l) => (
        <tr key={`${l.mode}-${l.cs}`}>
          <td className={`${cell} text-center`}>{l.category}</td>
          <td className={`${cell} text-center`}>{l.mode}</td>
          <Amounts a={l} />
          <td className={cell}>{l.cs}</td>
          <td className={cell} />
        </tr>
      ))}
      <tr>
        <td className={`${cell} text-center`} colSpan={2}>
          SUB TOTAL
        </td>
        <Amounts a={group.subtotal} />
        <td className={cell} colSpan={2} />
      </tr>
      <Rekap label="REKAP SUB TOTAL" a={group.subtotal} />
    </>
  );
}
