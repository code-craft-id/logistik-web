import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { EmptyState } from "@/components/patterns/content-state";
import { InfoTip } from "@/components/patterns/info-tip";
import { PageTabs } from "@/components/patterns/page-tabs";
import { SelectAllCheckbox } from "@/components/patterns/select-all";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listTransactions } from "@/features/bookings/server/queries";
import { permits } from "@/features/identity/permissions";
import { one } from "@/features/modul/components/page-bits";
import { requirePagePermission } from "@/lib/auth/page-access";
import { businessDateString } from "@/lib/date/business-date";
import { awbScanEnabled } from "@/lib/features";

export const metadata: Metadata = { title: "Kelola On Site" };

// Query-dependent tabs; blocking render.
export const instant = false;

const tabs = [
  { key: "outbound", label: "On Site Outbound", href: "/transactions" },
  {
    key: "inbound",
    label: "On Site Inbound",
    href: "/transactions?tab=inbound",
  },
];

const link =
  "inline-flex min-h-11 items-center text-primary underline underline-offset-4";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const current = await requirePagePermission("view", "transaction");
  const scanEnabled =
    awbScanEnabled() && permits(current.actor, "use", "awb_scan");
  const query = await searchParams;
  const direction = one(query.tab) === "inbound" ? "inbound" : "outbound";
  const search = one(query.search) ?? "";
  const transactions = await listTransactions({
    limit: 100,
    direction,
    search,
  });

  return (
    <div className="min-w-0 space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {direction === "inbound"
                ? "Kelola On Site Add"
                : "Kelola On Site"}
            </h1>
            <InfoTip
              text={
                direction === "inbound"
                  ? "100 AWB terbaru yang menuju cabang Anda. Centang AWB lalu Print terpilih untuk mencetak sekaligus di tab baru."
                  : "100 AWB terbaru dari cabang Anda. Centang AWB lalu Print terpilih untuk mencetak sekaligus di tab baru."
              }
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="min-h-11">
            <Link href="/transactions/lookup">Lookup AWB</Link>
          </Button>
          {scanEnabled && (
            <Button asChild variant="outline" className="min-h-11">
              <Link href="/transactions/scan">Scan AWB</Link>
            </Button>
          )}
          <Button asChild className="min-h-11">
            <Link href="/transactions/new">Tambah AWB</Link>
          </Button>
        </div>
      </header>
      <PageTabs label="Jenis AWB" tabs={tabs} active={direction} />
      <Form
        action="/transactions"
        className="flex flex-col gap-2 rounded-lg border bg-background p-4 sm:flex-row sm:items-end"
      >
        {direction === "inbound" && (
          <input type="hidden" name="tab" value="inbound" />
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <label htmlFor="awb-search" className="text-sm font-medium">
            AWB No. / DO No.
          </label>
          <Input
            id="awb-search"
            name="search"
            maxLength={50}
            defaultValue={search}
            className="min-h-11"
          />
        </div>
        <Button type="submit" variant="outline" className="min-h-11">
          Cari
        </Button>
      </Form>
      {transactions.length === 0 ? (
        <EmptyState
          title={search ? "Tidak ada AWB yang cocok" : "Belum ada AWB"}
          description={
            search
              ? "Ubah kata pencarian atau kosongkan untuk melihat semua AWB."
              : direction === "inbound"
                ? "AWB yang menuju cabang Anda akan tampil di sini."
                : "AWB yang dibuat lewat Tambah AWB akan tampil di sini."
          }
        />
      ) : (
        <form
          action="/print/awb"
          method="get"
          target="_blank"
          className="min-w-0 space-y-3 rounded-lg border bg-background"
          rel="noopener"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-3">
            <SelectAllCheckbox name="ids" />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" className="min-h-11">
                Print terpilih
              </Button>
              <Button
                type="submit"
                formAction="/print/koli"
                variant="outline"
                className="min-h-11"
              >
                Print label koli
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table className="min-w-[56rem]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <span className="sr-only">Pilih</span>
                  </TableHead>
                  <TableHead className="w-12">No.</TableHead>
                  <TableHead>AWB No.</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>DO No.</TableHead>
                  <TableHead>Pengirim</TableHead>
                  <TableHead>Penerima</TableHead>
                  <TableHead>Cabang Asal</TableHead>
                  <TableHead>Tujuan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Koli</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t, index) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        name="ids"
                        value={t.id}
                        aria-label={`Pilih AWB ${t.awbNo ?? t.id}`}
                        className="size-4"
                      />
                    </TableCell>
                    <TableCell className="tabular-nums">{index + 1}</TableCell>
                    <TableCell>{t.awbNo || "-"}</TableCell>
                    <TableCell>
                      {businessDateString(t.transactionDate)}
                    </TableCell>
                    <TableCell>{t.doNo || "-"}</TableCell>
                    <TableCell>{t.senderName || "-"}</TableCell>
                    <TableCell>{t.receiverName || "-"}</TableCell>
                    <TableCell>{t.originBranch?.name ?? "-"}</TableCell>
                    <TableCell>{t.destinationBranch?.name ?? "-"}</TableCell>
                    <TableCell>{t.status}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {t.koli ?? 0}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Link href={`/transactions/${t.id}`} className={link}>
                        Detail
                      </Link>{" "}
                      ·{" "}
                      <a
                        href={`/print/awb?ids=${t.id}`}
                        target="_blank"
                        rel="noopener"
                        className={link}
                      >
                        Print
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </form>
      )}
    </div>
  );
}
