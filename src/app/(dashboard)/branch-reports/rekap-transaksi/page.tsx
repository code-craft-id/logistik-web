import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { InfoTip } from "@/components/patterns/info-tip";
import { Button } from "@/components/ui/button";
import { isAdministrator, permits } from "@/features/identity/permissions";
import { currentIdentity } from "@/features/identity/server/context";
import { requirePagePermission } from "@/lib/auth/page-access";
import { businessYearMonth } from "@/lib/date/business-date";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Rekap Transaksi" };

// Session-dependent branch list; blocking render.
export const instant = false;

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
const field = "min-h-11 w-full rounded-md border bg-background px-2 text-sm";

export default async function Page() {
  await requirePagePermission("view", "transaction_report");
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const branches = await prisma.branch.findMany({
    where: {
      deletedAt: null,
      ...(isAdministrator(current.actor)
        ? {}
        : { id: { in: current.actor.branchIds } }),
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const canExport = permits(current.actor, "export", "transaction_report");
  const now = new Date();
  const businessNow = businessYearMonth(now);
  const year = businessNow.year;
  const own = current.actor.branchIds.find((id) =>
    branches.some((b) => b.id === id),
  );
  return (
    <div className="min-w-0 space-y-5">
      <header className="flex items-center gap-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Rekap Transaksi
        </h1>
        <InfoTip text="Unduh Excel rekap AWB per hari untuk satu cabang asal, dikelompokkan per cabang tujuan: Total AWB, Koli, Berat, Volume, serta Grand Total per jenis pembayaran (CASH, KREDIT, COD) dan Total Penagihan. Multiple Sheet = satu sheet per tanggal; One Sheet = semua tanggal dalam satu sheet." />
      </header>
      <form
        action="/branch-reports/rekap-transaksi/export"
        method="get"
        className="grid max-w-xl gap-4 rounded-lg border bg-background p-4"
      >
        <div className="grid gap-2 sm:grid-cols-[9rem_1fr_7rem] sm:items-center">
          <label htmlFor="recap-month" className="text-sm font-medium">
            Bulan
          </label>
          <select
            id="recap-month"
            name="month"
            defaultValue={businessNow.month}
            className={field}
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            name="year"
            aria-label="Tahun"
            defaultValue={year}
            className={field}
          >
            {Array.from({ length: 7 }, (_, i) => year - i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2 sm:grid-cols-[9rem_1fr] sm:items-center">
          <label htmlFor="recap-branch" className="text-sm font-medium">
            Cabang
          </label>
          <select
            id="recap-branch"
            name="branchId"
            required
            defaultValue={own ?? ""}
            className={field}
          >
            <option value="">Pilih cabang…</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2 sm:grid-cols-[9rem_1fr] sm:items-center">
          <label htmlFor="recap-sheet" className="text-sm font-medium">
            Jenis Lembar
          </label>
          <select
            id="recap-sheet"
            name="sheet"
            defaultValue="multiple"
            className={field}
          >
            <option value="multiple">-- Multiple Sheet --</option>
            <option value="one">-- One Sheet --</option>
          </select>
        </div>
        <div className="space-y-2">
          <Button
            type="submit"
            variant="destructive"
            className="min-h-11"
            disabled={!canExport}
          >
            Ekspor Excel
          </Button>
          {!canExport && (
            <p className="text-sm text-muted-foreground">
              Grup Anda belum punya hak Laporan Transaksi: ekspor. Minta admin
              menambahkannya di Hak Akses Menu.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
