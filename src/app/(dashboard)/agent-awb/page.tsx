import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/patterns/content-state";
import { PageTabs } from "@/components/patterns/page-tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { permits } from "@/features/identity/permissions";
import { currentIdentity } from "@/features/identity/server/context";
import {
  day,
  ListFilter,
  ModulHeader,
  one,
  rupiah,
} from "@/features/modul/components/page-bits";
import { agentAwbs } from "@/features/organization/server/agent-reports";

export const metadata: Metadata = { title: "On Site Agent" };

// Session- and query-dependent page; blocking render.
export const instant = false;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const current = await currentIdentity();
  if (!current) redirect("/login");
  if (!permits(current.actor, "view", "transaction"))
    return (
      <EmptyState
        title="Akses ditolak"
        description="Grup Anda belum memiliki hak lihat Transaksi. Minta admin menambahkannya di Hak Akses Menu."
      />
    );
  const query = await searchParams;
  const print = one(query.view) === "print";
  const { filters, rows } = await agentAwbs(current.actor, {
    search: one(query.search) ?? "",
    from: one(query.from),
    to: one(query.to),
  });
  return (
    <div className="min-w-0 space-y-5">
      <ModulHeader
        title={print ? "Print Agent" : "On Site Agent"}
        info="AWB yang dibuat untuk agen. Tambah AWB membuka Entry AWB dengan pilihan Agen: saat disimpan, saldo deposit agen dipotong Grand Total dikurangi komisi agen (komisi % x Grand Total); AWB ditolak bila saldo kurang. Void AWB mengembalikan potongan. Centang AWB lalu Print terpilih untuk mencetak resi."
      >
        {permits(current.actor, "create", "transaction") && (
          <Button asChild className="min-h-11">
            <Link href="/transactions/new?agent=1">Tambah AWB</Link>
          </Button>
        )}
      </ModulHeader>
      <ListFilter
        action="/agent-awb"
        searchLabel="AWB No. / DO No."
        values={{ search: filters.search, from: filters.from, to: filters.to }}
        hidden={print ? { view: "print" } : undefined}
      />
      <PageTabs
        label="Transaksi Agent"
        active={print ? "print" : "onsite"}
        tabs={[
          { key: "onsite", label: "On Site Agent", href: "/agent-awb" },
          { key: "print", label: "Print Agent", href: "/agent-awb?view=print" },
        ]}
      />
      {rows.length === 0 ? (
        <EmptyState
          title="Belum ada AWB agen"
          description="Klik Tambah AWB untuk membuat AWB atas nama agen."
        />
      ) : (
        <form
          action="/print/awb"
          method="get"
          target="_blank"
          rel="noopener"
          className="space-y-3"
        >
          <Button type="submit" variant="outline" className="min-h-11">
            Print terpilih
          </Button>
          <div className="overflow-x-auto rounded-lg border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pilih</TableHead>
                  <TableHead>AWB No.</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>DO No.</TableHead>
                  <TableHead>Agen</TableHead>
                  <TableHead>Tujuan</TableHead>
                  <TableHead>Pengirim</TableHead>
                  <TableHead>Penerima</TableHead>
                  <TableHead className="text-right">Koli</TableHead>
                  <TableHead className="text-right">Kilo</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                  <TableHead className="text-right">Biaya (Rp)</TableHead>
                  <TableHead className="text-right">Komisi (Rp)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        name="ids"
                        value={r.id}
                        aria-label={`Pilih AWB ${r.awbNo ?? r.id}`}
                        className="size-4"
                      />
                    </TableCell>
                    <TableCell className="font-mono">
                      <Link
                        href={`/transactions/${r.id}`}
                        className="text-primary underline underline-offset-4"
                      >
                        {r.awbNo ?? r.id}
                      </Link>
                    </TableCell>
                    <TableCell>{day(r.transactionDate)}</TableCell>
                    <TableCell>{r.doNo ?? "-"}</TableCell>
                    <TableCell>{r.agent?.name ?? "-"}</TableCell>
                    <TableCell>{r.destinationBranch?.name ?? "-"}</TableCell>
                    <TableCell>{r.senderName ?? "-"}</TableCell>
                    <TableCell>{r.receiverName ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      {r.koli ?? "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.kilo?.toString() ?? "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.volume?.toString() ?? "-"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {rupiah(r.biaya?.toString())}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {rupiah(r.commission?.toString())}
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
