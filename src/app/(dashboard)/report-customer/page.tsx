import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { InfoTip } from "@/components/patterns/info-tip";
import { Button } from "@/components/ui/button";
import { permits } from "@/features/identity/permissions";
import { currentIdentity } from "@/features/identity/server/context";
import { requirePagePermission } from "@/lib/auth/page-access";
import { businessDateString } from "@/lib/date/business-date";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Report Customer" };

// Session-dependent options; blocking render.
export const instant = false;

const field = "min-h-11 w-full rounded-md border bg-background px-2 text-sm";

function Choice({
  id,
  label,
  name,
  all,
  options,
}: {
  id: string;
  label: string;
  name: string;
  all: string;
  options: { id: number; name: string }[];
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[9rem_1fr] sm:items-center">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <select id={id} name={name} defaultValue="" className={field}>
        <option value="">{all}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default async function Page() {
  await requirePagePermission("view", "transaction_report");
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const [branches, customers, costTypes] = await Promise.all([
    prisma.branch.findMany({
      // Any branch: rows are still limited to AWBs from or to the user's branches.
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.customer.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 2000,
    }),
    prisma.costType.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  const canExport = permits(current.actor, "export", "transaction_report");
  const today = businessDateString();
  return (
    <div className="min-w-0 space-y-5">
      <header className="flex items-center gap-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Report Customer
        </h1>
        <InfoTip text="Unduh Excel detail AWB (Detail Transaction Customer) untuk periode maksimal 31 hari: data resi, customer, pengirim, penerima, barang dan biaya, jenis tagihan (CASH, TRF, KREDIT, COD), COD dan status terakhir. Saring per Origin, Destination, Customer dan Billing Type. AWB yang di-void tidak ikut." />
      </header>
      <form
        action="/report-customer/export"
        method="get"
        className="grid max-w-2xl gap-4 rounded-lg border bg-background p-4"
      >
        <fieldset className="grid gap-2 sm:grid-cols-[9rem_1fr_1fr] sm:items-center">
          <legend className="sr-only">Periode Date</legend>
          <span className="text-sm font-medium">Periode Date</span>
          <input
            type="date"
            name="from"
            aria-label="Tanggal awal"
            required
            defaultValue={today}
            className={field}
          />
          <input
            type="date"
            name="to"
            aria-label="Tanggal akhir"
            required
            defaultValue={today}
            className={field}
          />
        </fieldset>
        <Choice
          id="rc-origin"
          label="Origin"
          name="originId"
          all="-- All Origin --"
          options={branches}
        />
        <Choice
          id="rc-destination"
          label="Destination"
          name="destinationId"
          all="-- All Destination --"
          options={branches}
        />
        <Choice
          id="rc-customer"
          label="Customer"
          name="customerId"
          all="-- All Customer --"
          options={customers}
        />
        <Choice
          id="rc-billing"
          label="Billing Type"
          name="costTypeId"
          all="-- All Billing Type --"
          options={costTypes}
        />
        <div className="space-y-2">
          <Button
            type="submit"
            variant="destructive"
            className="min-h-11"
            disabled={!canExport}
          >
            Export Excel
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
