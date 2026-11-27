import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { InfoTip } from "@/components/patterns/info-tip";
import { Button } from "@/components/ui/button";
import { isAdministrator } from "@/features/identity/permissions";
import { currentIdentity } from "@/features/identity/server/context";
import { requirePagePermission } from "@/lib/auth/page-access";
import { businessDateString } from "@/lib/date/business-date";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Rekap Transaksi Harian" };

// Session-dependent branch list; blocking render.
export const instant = false;

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
  const own = current.actor.branchIds.find((id) =>
    branches.some((b) => b.id === id),
  );
  return (
    <div className="min-w-0 space-y-5">
      <header className="flex items-center gap-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Rekap Transaksi Harian
        </h1>
        <InfoTip text="Cetak rekap pendapatan satu cabang asal untuk satu tanggal: Total Resi dan Grand Total AWB per Kategori (Layanan), Kiriman Via (Moda) dan CS, dipisah per jenis pembayaran (Tunai-Onhand = CASH, Tunai-Transfer = TRF, Kredit = KREDIT, Tagih Tujuan = COD). AWB yang di-void tidak dihitung." />
      </header>
      <form
        action="/print/rekap-transaksi-harian"
        method="get"
        target="_blank"
        rel="noopener"
        className="grid max-w-xl gap-4 rounded-lg border bg-background p-4"
      >
        <div className="grid gap-2 sm:grid-cols-[9rem_1fr] sm:items-center">
          <label htmlFor="daily-recap-date" className="text-sm font-medium">
            Tanggal
          </label>
          <input
            id="daily-recap-date"
            type="date"
            name="date"
            required
            defaultValue={businessDateString()}
            className={field}
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-[9rem_1fr] sm:items-center">
          <label htmlFor="daily-recap-branch" className="text-sm font-medium">
            Cabang
          </label>
          <select
            id="daily-recap-branch"
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
        <div>
          <Button type="submit" variant="destructive" className="min-h-11">
            Cetak
          </Button>
        </div>
      </form>
    </div>
  );
}
