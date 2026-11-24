import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/patterns/content-state";
import { PageTabs } from "@/components/patterns/page-tabs";
import { Input } from "@/components/ui/input";
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
import { receiveCodAction } from "@/features/modul/actions";
import { ActionForm } from "@/features/modul/components/action-form";
import {
  day,
  ListFilter,
  ModulHeader,
  one,
  rupiah,
} from "@/features/modul/components/page-bits";
import { listCod } from "@/features/modul/server/cod";
import { businessDateTimeString } from "@/lib/date/business-date";

export const metadata: Metadata = { title: "COD" };

// Session- and query-dependent page; blocking render.
export const instant = false;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const actor = current.actor;
  if (!permits(actor, "view", "payment"))
    return (
      <EmptyState
        title="Akses ditolak"
        description="Grup Anda belum memiliki hak lihat Pembayaran. Minta admin menambahkannya di Hak Akses Menu."
      />
    );
  const query = await searchParams;
  const { filters, rows } = await listCod(actor, {
    tab: one(query.tab),
    search: one(query.search) ?? "",
    from: one(query.from),
    to: one(query.to),
  });
  const received = filters.tab === "received";
  const canReceive = !received && permits(actor, "create", "payment");
  return (
    <div className="min-w-0 space-y-5">
      <ModulHeader
        title={received ? "Kas Terima" : "COD List"}
        info="COD List: AWB dengan Nilai COD yang tujuannya cabang Anda dan kasnya belum diserahkan. Setelah AWB Delivered, isi Ket. Pembayaran lalu Terima Kas (butuh hak Pembayaran: buat); AWB pindah ke Kas Terima beserta user dan tanggal pembayaran. Belum membuat jurnal akunting."
      />
      <PageTabs
        label="COD"
        active={filters.tab}
        tabs={[
          { key: "list", label: "Cod List", href: "/cod" },
          { key: "received", label: "Kas Terima", href: "/cod?tab=received" },
        ]}
      />
      <ListFilter
        action="/cod"
        searchLabel="AWB No. / DO No."
        values={{
          search: filters.search,
          from: filters.from,
          to: filters.to,
        }}
        hidden={received ? { tab: "received" } : undefined}
      />
      {rows.length === 0 ? (
        <EmptyState
          title="Belum ada data"
          description={
            received
              ? "Belum ada kas COD yang diterima untuk filter ini."
              : "Tidak ada AWB COD yang menunggu kas untuk filter ini."
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>AWB No.</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>DO No.</TableHead>
                <TableHead>Tujuan</TableHead>
                <TableHead>Pengirim</TableHead>
                <TableHead>Penerima</TableHead>
                <TableHead className="text-right">Koli</TableHead>
                <TableHead className="text-right">Kilo</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead className="text-right">Nilai COD</TableHead>
                <TableHead className="text-right">Fee COD</TableHead>
                <TableHead className="text-right">Biaya (Rp)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ket. Pembayaran</TableHead>
                {received && <TableHead>User Pembayaran</TableHead>}
                {received && <TableHead>Tgl. Pembayaran</TableHead>}
                {canReceive && <TableHead>Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} className="align-top">
                  <TableCell className="font-mono">{r.awbNo ?? "-"}</TableCell>
                  <TableCell>{day(r.transactionDate)}</TableCell>
                  <TableCell>{r.doNo ?? "-"}</TableCell>
                  <TableCell>{r.destinationBranch?.name ?? "-"}</TableCell>
                  <TableCell>{r.senderName ?? "-"}</TableCell>
                  <TableCell>{r.receiverName ?? "-"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.koli ?? "-"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.kilo?.toString() ?? "-"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.volume?.toString() ?? "-"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {rupiah(r.codValue?.toString())}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {rupiah(r.codFee?.toString())}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {rupiah(r.biaya?.toString())}
                  </TableCell>
                  <TableCell>{r.status}</TableCell>
                  <TableCell>{r.codReceivedNote ?? "-"}</TableCell>
                  {received && (
                    <TableCell>{r.codReceivedBy?.name ?? "-"}</TableCell>
                  )}
                  {received && (
                    <TableCell>
                      {businessDateTimeString(r.codReceivedAt)}
                    </TableCell>
                  )}
                  {canReceive && (
                    <TableCell className="min-w-56">
                      {r.status === "Delivered" ? (
                        <ActionForm
                          action={receiveCodAction}
                          submit={
                            <button
                              type="submit"
                              className="inline-flex min-h-11 items-center rounded-md bg-primary px-3 text-sm text-primary-foreground"
                            >
                              Terima Kas
                            </button>
                          }
                        >
                          <input
                            type="hidden"
                            name="transactionId"
                            value={r.id}
                          />
                          <Input
                            name="note"
                            required
                            minLength={2}
                            maxLength={255}
                            placeholder="Ket. Pembayaran"
                            aria-label={`Ket. Pembayaran AWB ${r.awbNo ?? r.id}`}
                            className="min-h-11"
                          />
                        </ActionForm>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Menunggu Delivered
                        </span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
