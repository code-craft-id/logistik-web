import Link from "next/link";
import { EmptyState } from "@/components/patterns/content-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TicketDTO } from "../contracts";

export function TicketList({
  items,
  total,
  page,
  pageSize,
  search,
  canCreate,
}: {
  items: TicketDTO[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  canCreate: boolean;
}) {
  const pageLink = (next: number) =>
    `/ticketting?${new URLSearchParams({ search, page: String(next), pageSize: String(pageSize) })}`;
  return (
    <div className="min-w-0 space-y-5 [overflow-wrap:anywhere]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Ticketing
          </h1>
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">
            Tiket yang tersedia dalam cakupan akses Anda.
          </p>
        </div>
        {canCreate && (
          <Button asChild className="min-h-11">
            <Link href="/ticketting/new">Buat tiket</Link>
          </Button>
        )}
      </div>
      <section
        className="min-w-0 overflow-hidden rounded-lg border bg-background"
        aria-label="Daftar tiket"
      >
        <form
          action="/ticketting"
          method="get"
          className="grid gap-3 border-b bg-muted/40 p-4 sm:flex sm:flex-wrap sm:items-end"
        >
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor="ticket-search">Cari judul atau menu</Label>
            <Input
              id="ticket-search"
              name="search"
              defaultValue={search}
              maxLength={100}
              className="min-h-11"
            />
          </div>
          <input type="hidden" name="pageSize" value={pageSize} />
          <Button type="submit" variant="secondary" className="min-h-11">
            Cari tiket
          </Button>
          {search && (
            <Button asChild variant="outline" className="min-h-11">
              <Link href="/ticketting">Hapus pencarian</Link>
            </Button>
          )}
        </form>
        {!items.length ? (
          <EmptyState
            title={
              search || page > 1
                ? "Tidak ada tiket yang cocok"
                : "Belum ada tiket"
            }
            description={
              search || page > 1
                ? "Ubah pencarian atau kembali ke halaman pertama."
                : "Tiket yang Anda buat di cabang yang masih diizinkan akan tampil di sini."
            }
            action={
              search || page > 1 ? (
                <Button asChild variant="outline" className="min-h-11">
                  <Link href="/ticketting">Kembali ke daftar</Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table className="min-w-5xl [&_td]:align-top">
            <caption className="sr-only">
              Tiket, terbaru terlebih dahulu. Waktu pembuatan dalam UTC.
            </caption>
            <TableHeader>
              <TableRow>
                {[
                  "ID internal",
                  "Dibuat (UTC)",
                  "Judul",
                  "Menu",
                  "Cabang (ID)",
                  "Prioritas",
                  "Link URL",
                  "Aksi",
                ].map((label) => (
                  <TableHead key={label} scope="col">
                    {label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-mono tabular-nums">
                    {ticket.id}
                  </TableCell>
                  <TableCell>
                    <time
                      dateTime={ticket.createdAt}
                      className="whitespace-nowrap font-mono text-xs"
                    >
                      {ticket.createdAt}
                    </time>
                  </TableCell>
                  <TableCell className="min-w-48 max-w-xs whitespace-normal font-medium [overflow-wrap:anywhere]">
                    {ticket.subject}
                  </TableCell>
                  <TableCell className="min-w-40 max-w-xs whitespace-normal [overflow-wrap:anywhere]">
                    {ticket.menuName}
                  </TableCell>
                  <TableCell>{ticket.branchId}</TableCell>
                  <TableCell>{ticket.priority}</TableCell>
                  <TableCell className="min-w-48 max-w-xs whitespace-normal [overflow-wrap:anywhere]">
                    {ticket.relatedPageUrl}
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="outline" className="min-h-11">
                      <Link
                        href={`/ticketting/${ticket.id}`}
                        aria-label={`Lihat tiket ID ${ticket.id}`}
                      >
                        Lihat
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4 text-sm">
          <p>
            {total} tiket · Halaman {page}
          </p>
          <nav aria-label="Halaman tiket" className="flex flex-wrap gap-2">
            {page > 1 && (
              <Button asChild variant="outline" className="min-h-11">
                <Link href={pageLink(page - 1)}>Sebelumnya</Link>
              </Button>
            )}
            {page * pageSize < total && page < 100000 && (
              <Button asChild variant="outline" className="min-h-11">
                <Link href={pageLink(page + 1)}>Berikutnya</Link>
              </Button>
            )}
          </nav>
        </div>
      </section>
    </div>
  );
}

export function TicketDetail({ ticket }: { ticket: TicketDTO }) {
  const fields = [
    ["ID internal", String(ticket.id)],
    ["Dibuat (UTC)", ticket.createdAt],
    ["Cabang pemilik (ID)", String(ticket.branchId)],
    ["Pembuat (ID)", String(ticket.createdById)],
    ["Menu", ticket.menuName],
    ["Prioritas", ticket.priority],
    ["Link URL terkait", ticket.relatedPageUrl],
    ["Keterangan", ticket.remarks ?? "Tidak ada keterangan."],
  ];
  return (
    <div className="min-w-0 space-y-5 [overflow-wrap:anywhere]">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {ticket.subject}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Detail tiket · ID internal {ticket.id}
        </p>
      </div>
      <dl className="grid min-w-0 gap-6 rounded-lg border bg-background p-4 sm:grid-cols-2 sm:p-6">
        {fields.map(([label, value]) => (
          <div
            key={label}
            className={
              label === "Keterangan" || label === "Link URL terkait"
                ? "min-w-0 space-y-2 sm:col-span-2"
                : "min-w-0 space-y-2"
            }
          >
            <dt className="text-sm font-medium text-muted-foreground">
              {label}
            </dt>
            <dd className="whitespace-pre-wrap text-sm [overflow-wrap:anywhere]">
              {label === "Dibuat (UTC)" ? (
                <time dateTime={value}>{value}</time>
              ) : (
                value
              )}
            </dd>
          </div>
        ))}
      </dl>
      <Button asChild variant="outline" className="min-h-11">
        <Link href="/ticketting">Kembali ke daftar</Link>
      </Button>
    </div>
  );
}
