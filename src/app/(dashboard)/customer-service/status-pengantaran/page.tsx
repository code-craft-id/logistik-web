import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { redirect } from "next/navigation";
import { InfoTip } from "@/components/patterns/info-tip";
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
import { permits } from "@/features/identity/permissions";
import { currentIdentity } from "@/features/identity/server/context";
import { StatusImportDialog } from "@/features/shipments/components/status-import-dialog";
import { listShipmentStatus } from "@/features/shipments/server/status-list";
import { requirePagePermission } from "@/lib/auth/page-access";

export const metadata: Metadata = { title: "Kelola Status Pengiriman" };

// Query- and session-dependent; blocking render.
export const instant = false;

const one = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v) ?? "";
const when = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("id-ID", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "Asia/Jakarta",
      })
    : "-";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePagePermission("view", "transaction");
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const params = await searchParams;
  const search = one(params.q).slice(0, 60);
  const status = one(params.status).slice(0, 30);
  const page = Number(one(params.page)) || 1;
  const data = await listShipmentStatus(current.actor, {
    search,
    status,
    page,
  });
  const canUpdate = permits(current.actor, "update", "transaction");
  const link = (p: number) => {
    const q = new URLSearchParams();
    if (search) q.set("q", search);
    if (status) q.set("status", status);
    q.set("page", String(p));
    return `/customer-service/status-pengantaran?${q}`;
  };

  return (
    <div className="min-w-0 space-y-5">
      <header className="flex items-center gap-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Kelola Status Pengiriman
        </h1>
        <InfoTip text="Daftar AWB dari/ke cabang Anda beserta status pengantaran: penerima, diterima oleh, tanggal diterima dan lead time. Tombol Ubah membuka detail AWB untuk mengubah status (butuh hak Transaksi: ubah) atau scan Konfirmasi. SLA: In Progress sampai diterima, lalu On Time bila lead time tidak melebihi Estimasi rute di Cek Ongkir (angka terbesar, mis. 1-2 hari = 2 hari) atau Late bila melebihi; - bila rute belum punya Estimasi." />
      </header>
      <Form
        action="/customer-service/status-pengantaran"
        className="grid gap-3 rounded-lg border bg-background p-3 sm:grid-cols-[1fr_14rem_auto]"
      >
        <Input
          name="q"
          defaultValue={search}
          placeholder="Cari AWB, DO, pengirim atau penerima"
          aria-label="Cari"
          className="min-h-11"
        />
        <select
          name="status"
          defaultValue={status}
          aria-label="Status"
          className="min-h-11 rounded-md border bg-background px-2 text-sm"
        >
          <option value="">Semua status</option>
          {data.statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" className="min-h-11">
            Cari
          </Button>
          <Button asChild variant="outline" className="min-h-11">
            <Link href="/customer-service/status-pengantaran">Refresh</Link>
          </Button>
          <Button asChild variant="outline" className="min-h-11">
            <a
              href={`/customer-service/status-pengantaran/export?${new URLSearchParams({ q: search, status })}`}
            >
              Export Excel
            </a>
          </Button>
        </div>
      </Form>
      <section
        aria-label="Daftar status pengiriman"
        className="min-w-0 rounded-lg border bg-background"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-medium">Daftar Status Pengiriman</h2>
            {canUpdate && (
              <>
                <Button asChild variant="outline" className="min-h-11">
                  <a href="/customer-service/status-pengantaran/template">
                    Template Import
                  </a>
                </Button>
                <StatusImportDialog />
              </>
            )}
          </div>
          <span className="text-muted-foreground">
            {data.total.toLocaleString("id-ID")} AWB · halaman {data.page} dari{" "}
            {data.pages}
          </span>
        </div>
        <div className="overflow-x-auto">
          <Table className="min-w-[78rem]">
            <TableHeader>
              <TableRow>
                <TableHead>AWB No.</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Asal</TableHead>
                <TableHead>Tujuan</TableHead>
                <TableHead>Pengirim</TableHead>
                <TableHead>Layanan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Penerima</TableHead>
                <TableHead>Diterima Oleh</TableHead>
                <TableHead>Tanggal Diterima</TableHead>
                <TableHead>Acc. In</TableHead>
                <TableHead className="text-right">L.Time</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={14}
                    className="p-4 text-center text-muted-foreground"
                  >
                    Tidak ada AWB untuk pencarian ini.
                  </TableCell>
                </TableRow>
              ) : (
                data.rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono">{r.awbNo}</TableCell>
                    <TableCell className="tabular-nums">{r.date}</TableCell>
                    <TableCell>{r.origin ?? "-"}</TableCell>
                    <TableCell>{r.destination ?? "-"}</TableCell>
                    <TableCell className="whitespace-normal">
                      {r.sender ?? "-"}
                    </TableCell>
                    <TableCell>{r.service ?? "-"}</TableCell>
                    <TableCell>
                      <span className="rounded-full border px-2 py-0.5 text-xs whitespace-nowrap">
                        {r.status}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      {r.receiver ?? "-"}
                    </TableCell>
                    <TableCell>{r.receivedBy ?? "-"}</TableCell>
                    <TableCell className="tabular-nums">
                      {when(r.receivedAt)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {when(r.accIn)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.leadTimeDays ?? "-"}
                    </TableCell>
                    <TableCell>{r.sla}</TableCell>
                    <TableCell>
                      <Link
                        href={`/transactions/${r.id}`}
                        className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
                        aria-label={`${canUpdate ? "Ubah status" : "Lihat"} AWB ${r.awbNo}`}
                      >
                        {canUpdate ? "Ubah" : "Lihat"}
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {data.pages > 1 && (
          <nav
            aria-label="Halaman"
            className="flex items-center justify-end gap-2 border-t p-3"
          >
            {data.page > 1 && (
              <Button asChild variant="outline" className="min-h-11">
                <Link href={link(data.page - 1)}>Sebelumnya</Link>
              </Button>
            )}
            {data.page < data.pages && (
              <Button asChild variant="outline" className="min-h-11">
                <Link href={link(data.page + 1)}>Berikutnya</Link>
              </Button>
            )}
          </nav>
        )}
      </section>
    </div>
  );
}
