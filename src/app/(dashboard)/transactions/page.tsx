import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/patterns/content-state";
import { InfoTip } from "@/components/patterns/info-tip";
import { SelectAllCheckbox } from "@/components/patterns/select-all";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listTransactions } from "@/features/bookings/server/queries";
import { requirePermission } from "@/lib/auth/session";

export const metadata: Metadata = { title: "On Site Outbound" };

const link =
  "inline-flex min-h-11 items-center text-primary underline underline-offset-4";

export default async function Page() {
  await requirePermission("view", "transaction");
  const transactions = await listTransactions({ limit: 50 });

  return (
    <div className="min-w-0 space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              On Site Outbound / AWB
            </h1>
            <InfoTip
              text={
                "50 AWB terbaru. Centang AWB lalu Print terpilih untuk mencetak sekaligus di tab baru."
              }
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="min-h-11">
            <Link href="/transactions/lookup">Lookup AWB</Link>
          </Button>
          <Button asChild className="min-h-11">
            <Link href="/transactions/new">Tambah AWB</Link>
          </Button>
        </div>
      </header>
      {transactions.length === 0 ? (
        <EmptyState
          title="Belum ada AWB"
          description="AWB yang dibuat lewat Tambah AWB akan tampil di sini."
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
            <Button type="submit" className="min-h-11">
              Print terpilih
            </Button>
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
                      {t.transactionDate.toISOString().slice(0, 10)}
                    </TableCell>
                    <TableCell>{t.doNo || "-"}</TableCell>
                    <TableCell>{t.senderName || "-"}</TableCell>
                    <TableCell>{t.receiverName || "-"}</TableCell>
                    <TableCell>{t.originBranch?.name ?? "-"}</TableCell>
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
