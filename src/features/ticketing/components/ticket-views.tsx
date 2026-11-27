import Link from "next/link";
import { EmptyState } from "@/components/patterns/content-state";
import { PageTabs } from "@/components/patterns/page-tabs";
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
import { ActionForm } from "@/features/modul/components/action-form";
import { businessDateTimeString } from "@/lib/date/business-date";
import {
  decideTicketAction,
  sendTicketMessageAction,
  setTicketStatusAction,
} from "../actions";
import { TICKET_STATUSES, type TicketDTO } from "../contracts";

const APPROVAL: Record<string, string> = {
  Approved: "Approve Finish",
  Revision: "Revisi",
};

function StatusBadge({ ticket }: { ticket: TicketDTO }) {
  const tone =
    ticket.approval === "Approved"
      ? "border-primary"
      : ticket.status === "Finish"
        ? "border-primary/60"
        : "border-muted-foreground/40";
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs whitespace-nowrap ${tone}`}
    >
      {ticket.approval === "Approved" ? "Selesai disetujui" : ticket.status}
    </span>
  );
}

export function TicketList({
  items,
  total,
  page,
  pageSize,
  search,
  tab = "all",
  canCreate,
}: {
  items: TicketDTO[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  tab?: "all" | "approval";
  canCreate: boolean;
}) {
  const pageLink = (next: number) =>
    `/ticketting?${new URLSearchParams({ search, page: String(next), pageSize: String(pageSize), ...(tab === "approval" ? { tab } : {}) })}`;
  return (
    <div className="min-w-0 space-y-5 [overflow-wrap:anywhere]">
      <PageTabs
        label="Ticketing"
        tabs={[
          { key: "all", label: "Tiket Support", href: "/ticketting" },
          {
            key: "approval",
            label: "Persetujuan Tiketing",
            href: "/ticketting?tab=approval",
          },
        ]}
        active={tab}
      />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {tab === "approval" ? "Persetujuan Tiketing" : "Ticketing"}
          </h1>
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">
            {tab === "approval"
              ? "Tiket Anda yang sudah Finish dan menunggu Approve Finish atau Revisi."
              : "Tiket yang tersedia dalam cakupan akses Anda."}
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
          {tab === "approval" && (
            <input type="hidden" name="tab" value="approval" />
          )}
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
              Tiket, terbaru terlebih dahulu. Waktu pembuatan dalam
              Asia/Jakarta.
            </caption>
            <TableHeader>
              <TableRow>
                {[
                  "ID internal",
                  "Dibuat (Asia/Jakarta)",
                  "Judul",
                  "Menu",
                  "Cabang (ID)",
                  "Prioritas",
                  "Status",
                  "Approval",
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
                      {businessDateTimeString(ticket.createdAt)}
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
                  <TableCell>
                    <StatusBadge ticket={ticket} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {ticket.approval ? APPROVAL[ticket.approval] : "-"}
                    {ticket.approvedBy && (
                      <span className="block text-xs text-muted-foreground">
                        {ticket.approvedBy}
                      </span>
                    )}
                  </TableCell>
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

export function TicketDetail({
  ticket,
  canManage = false,
  isCreator = false,
}: {
  ticket: TicketDTO;
  canManage?: boolean;
  isCreator?: boolean;
}) {
  const approved = ticket.approval === "Approved";
  const fields = [
    ["ID internal", String(ticket.id)],
    ["Dibuat (Asia/Jakarta)", ticket.createdAt],
    ["Cabang pemilik (ID)", String(ticket.branchId)],
    ["Pembuat", ticket.createdBy ?? String(ticket.createdById)],
    ["Status", approved ? "Finish (disetujui)" : ticket.status],
    [
      "Approval",
      ticket.approval
        ? `${APPROVAL[ticket.approval]}${ticket.approvedBy ? ` oleh ${ticket.approvedBy}` : ""}${ticket.approvedAt ? ` · ${businessDateTimeString(ticket.approvedAt)}` : ""}`
        : "Belum diputuskan",
    ],
    ...(ticket.approvalNote ? [["Catatan approval", ticket.approvalNote]] : []),
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
              {label === "Dibuat (Asia/Jakarta)" ? (
                <time dateTime={value}>{businessDateTimeString(value)}</time>
              ) : (
                value
              )}
            </dd>
          </div>
        ))}
      </dl>
      {canManage && !approved && (
        <section
          aria-label="Ubah status tiket"
          className="rounded-lg border bg-background p-4 sm:p-6"
        >
          <h2 className="mb-3 font-semibold">Ubah status (tim support)</h2>
          <ActionForm
            action={setTicketStatusAction}
            submit={
              <Button type="submit" className="min-h-11">
                Simpan status
              </Button>
            }
          >
            <input type="hidden" name="id" value={ticket.id} />
            <Label htmlFor="ticket-status">Status</Label>
            <select
              id="ticket-status"
              name="status"
              defaultValue={ticket.status}
              className="min-h-11 w-full max-w-xs rounded-md border border-input bg-background px-3 text-base md:text-sm"
            >
              {TICKET_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </ActionForm>
        </section>
      )}
      {isCreator && ticket.status === "Finish" && !ticket.approval && (
        <section
          aria-label="Persetujuan tiket"
          className="rounded-lg border bg-background p-4 sm:p-6"
        >
          <h2 className="mb-3 font-semibold">Persetujuan</h2>
          <ActionForm
            action={decideTicketAction}
            submit={
              <>
                <Button
                  type="submit"
                  name="decision"
                  value="Approved"
                  className="min-h-11"
                >
                  Approve Finish
                </Button>
                <Button
                  type="submit"
                  name="decision"
                  value="Revision"
                  variant="outline"
                  className="min-h-11"
                >
                  Revisi
                </Button>
              </>
            }
          >
            <input type="hidden" name="id" value={ticket.id} />
            <Label htmlFor="ticket-note">Catatan (wajib untuk Revisi)</Label>
            <Input
              id="ticket-note"
              name="note"
              maxLength={1000}
              className="min-h-11"
            />
          </ActionForm>
        </section>
      )}
      <section
        aria-label="Chat tiket"
        className="space-y-3 rounded-lg border bg-background p-4 sm:p-6"
      >
        <h2 className="font-semibold">Chat</h2>
        {ticket.messages?.length ? (
          <ol className="space-y-3">
            {ticket.messages.map((m) => (
              <li key={m.id} className="rounded-lg bg-muted px-3 py-2 text-sm">
                <p className="text-xs text-muted-foreground">
                  {m.author} · {businessDateTimeString(m.createdAt)}
                </p>
                <p className="whitespace-pre-line">{m.body}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">Belum ada pesan.</p>
        )}
        <ActionForm
          action={sendTicketMessageAction}
          reset
          submit={
            <Button type="submit" className="min-h-11">
              Kirim
            </Button>
          }
        >
          <input type="hidden" name="id" value={ticket.id} />
          <Label htmlFor="ticket-message">Pesan</Label>
          <textarea
            id="ticket-message"
            name="body"
            required
            maxLength={2000}
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm"
          />
        </ActionForm>
      </section>
      <Button asChild variant="outline" className="min-h-11">
        <Link href="/ticketting">Kembali ke daftar</Link>
      </Button>
    </div>
  );
}
