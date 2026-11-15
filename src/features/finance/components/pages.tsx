import "server-only";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ErrorState } from "@/components/patterns/content-state";
import { FormField } from "@/components/patterns/form-field";
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
import { id, listInput } from "../contracts";
import { financeService } from "../server/context";
import { CommandForm } from "./command-form";
import { InvoiceForm } from "./invoice-form";

export const financeLink = "text-primary underline underline-offset-4";
export async function financeEntry(resource = "invoice", action = "view") {
  const current = await currentIdentity();
  if (!current) redirect("/login");
  return permits(current.actor, action, resource) ? current.actor : null;
}
const denied = (
  <ErrorState
    title="Akses ditolak"
    description="Hubungi administrator untuk hak akses keuangan yang sesuai."
  />
);
export async function InvoiceListPage({
  query,
}: {
  query: Record<string, string | string[] | undefined>;
}) {
  const actor = await financeEntry();
  if (!actor) return denied;
  const input = listInput.safeParse(query);
  if (!input.success)
    return (
      <ErrorState
        title="Filter tidak valid"
        description="Periksa cabang dan nomor halaman."
      />
    );
  const result = await financeService.list(input.data);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Invoice</h1>
      <nav className="flex flex-wrap gap-4" aria-label="Keuangan">
        {permits(actor, "create", "invoice") && (
          <Link className={financeLink} href="/finance/invoices/new">
            Buat invoice
          </Link>
        )}
        <Link className={financeLink} href="/finance/accounting">
          Akuntansi & laporan
        </Link>
      </nav>
      <form className="flex flex-wrap items-end gap-3">
        <FormField id="filterBranch" label="ID cabang (opsional)">
          <Input
            id="filterBranch"
            name="branchId"
            type="number"
            min="1"
            defaultValue={input.data.branchId}
          />
        </FormField>
        <button className="min-h-11 rounded-md border px-4" type="submit">
          Terapkan
        </button>
      </form>
      <p>
        {result.total} invoice. Halaman {result.page}.
      </p>
      {result.items.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              {[
                "Invoice",
                "Cabang",
                "Tanggal",
                "Status",
                "Tagihan IDR",
                "Sisa IDR",
              ].map((v) => (
                <TableHead key={v}>{v}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.items.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <Link
                    className={financeLink}
                    href={`/finance/invoices/${r.id}`}
                  >
                    {r.number ?? `Draft #${r.id}`}
                  </Link>
                </TableCell>
                <TableCell>{r.branchId}</TableCell>
                <TableCell>{r.invoiceDate}</TableCell>
                <TableCell>{r.paymentStatus}</TableCell>
                <TableCell className="tabular-nums">{r.total}</TableCell>
                <TableCell className="tabular-nums">{r.balance}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p>Belum ada invoice untuk filter ini.</p>
      )}
      <nav className="flex gap-4" aria-label="Halaman invoice">
        {result.page > 1 && (
          <Link
            className={financeLink}
            href={`?page=${result.page - 1}${input.data.branchId ? `&branchId=${input.data.branchId}` : ""}`}
          >
            Sebelumnya
          </Link>
        )}
        {result.page * 30 < result.total && (
          <Link
            className={financeLink}
            href={`?page=${result.page + 1}${input.data.branchId ? `&branchId=${input.data.branchId}` : ""}`}
          >
            Berikutnya
          </Link>
        )}
      </nav>
    </div>
  );
}
export async function InvoiceNewPage() {
  if (!(await financeEntry("invoice", "create"))) return denied;
  const branches = await financeService.choices();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Buat invoice</h1>
      <Link className={financeLink} href="/finance/invoices">
        Daftar invoice
      </Link>
      {branches.length ? (
        <InvoiceForm branches={branches} />
      ) : (
        <p>Tidak ada cabang aktif yang dapat digunakan.</p>
      )}
    </div>
  );
}
export async function InvoiceDetailPage({ invoiceId }: { invoiceId: string }) {
  const actor = await financeEntry();
  if (!actor) return denied;
  const parsed = id.safeParse(invoiceId);
  if (!parsed.success) notFound();
  const row = await financeService.detail(parsed.data);
  return (
    <div className="space-y-6">
      <Link className={financeLink} href="/finance/invoices">
        Daftar invoice
      </Link>
      <h1 className="text-2xl font-semibold">
        {row.number ?? `Draft #${row.id}`}
      </h1>
      <p>
        Cabang {row.branchId} · Pelanggan {row.customerId} · {row.paymentStatus}
      </p>
      <dl className="grid gap-4 sm:grid-cols-3">
        <div>
          <dt>Tanggal / jatuh tempo</dt>
          <dd>
            {row.invoiceDate} / {row.dueDate}
          </dd>
        </div>
        <div>
          <dt>Tagihan IDR</dt>
          <dd className="tabular-nums">{row.total}</dd>
        </div>
        <div>
          <dt>Sisa IDR</dt>
          <dd className="tabular-nums">{row.balance}</dd>
        </div>
      </dl>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sumber transaksi</TableHead>
            <TableHead>Tagihan IDR</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {row.items.map((i) => (
            <TableRow key={i.id}>
              <TableCell>{i.transactionId}</TableCell>
              <TableCell className="tabular-nums">{i.amount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {row.status === "DRAFT" && permits(actor, "update", "invoice") && (
        <section className="space-y-4 border-t pt-5">
          <h2 className="text-lg font-semibold">Ubah draft</h2>
          <InvoiceForm
            draft={row}
            branches={[{ id: row.branchId, name: `Cabang ${row.branchId}` }]}
          />
        </section>
      )}
      {row.status === "DRAFT" && permits(actor, "issue", "invoice") && (
        <CommandForm
          label="Terbitkan invoice"
          values={{
            action: "invoice.issue",
            id: row.id,
            revision: row.revision,
          }}
        >
          <p>Tagihan dan sumber akan dikunci. Pastikan AWB layak ditagihkan.</p>
        </CommandForm>
      )}
      {row.status !== "VOID" && permits(actor, "void", "invoice") && (
        <CommandForm
          label="Batalkan invoice"
          values={{
            action: "invoice.void",
            id: row.id,
            revision: row.revision,
          }}
        >
          <FormField id="voidReason" label="Alasan pembatalan">
            <Input required name="reason" id="voidReason" maxLength={500} />
          </FormField>
          <FormField id="voidDate" label="Tanggal akuntansi pembatalan">
            <Input required type="date" name="accountingDate" id="voidDate" />
          </FormField>
        </CommandForm>
      )}
      {row.status === "ISSUED" && permits(actor, "create", "payment") && (
        <section className="space-y-4 border-t pt-5">
          <h2 className="text-lg font-semibold">Catat pembayaran</h2>
          <CommandForm
            label="Catat pembayaran"
            values={{ action: "payment.create", invoiceId: row.id, note: "" }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["amount", "Jumlah IDR", "text"],
                ["receivedDate", "Tanggal diterima", "date"],
                ["method", "Metode", "text"],
                ["reference", "Referensi", "text"],
                ["cashAccountId", "ID akun kas / bank", "number"],
              ].map(([name, label, type]) => (
                <FormField key={name} id={`receipt-${name}`} label={label}>
                  <Input
                    required={name !== "reference"}
                    id={`receipt-${name}`}
                    name={name}
                    type={type}
                    maxLength={160}
                  />
                </FormField>
              ))}
            </div>
          </CommandForm>
        </section>
      )}
      {permits(actor, "view", "payment") && (
        <section className="space-y-4 border-t pt-5">
          <h2 className="text-lg font-semibold">Riwayat pembayaran</h2>
          {!row.receipts.length && <p>Belum ada pembayaran.</p>}
          {row.receipts.map((r) => (
            <div key={r.id} className="space-y-3 border-b pb-4">
              <p>
                #{r.id} · {r.receivedDate} · {r.amount} IDR ·{" "}
                {r.reversalOfId ? `Pembalikan #${r.reversalOfId}` : r.method} ·{" "}
                {r.reference}
              </p>
              <p className="break-words text-sm">{r.note}</p>
              {!r.reversalOfId &&
                !row.receipts.some((x) => x.reversalOfId === r.id) &&
                permits(actor, "reverse", "payment") && (
                  <CommandForm
                    label={`Balikkan pembayaran #${r.id}`}
                    values={{ action: "payment.reverse", id: r.id }}
                  >
                    <FormField id={`reason-${r.id}`} label="Alasan koreksi">
                      <Input
                        required
                        id={`reason-${r.id}`}
                        name="reason"
                        maxLength={500}
                      />
                    </FormField>
                    <FormField
                      id={`reverse-date-${r.id}`}
                      label="Tanggal akuntansi pembalikan"
                    >
                      <Input
                        required
                        id={`reverse-date-${r.id}`}
                        name="accountingDate"
                        type="date"
                      />
                    </FormField>
                  </CommandForm>
                )}
            </div>
          ))}
        </section>
      )}
      <section className="space-y-3 border-t pt-5">
        <h2 className="text-lg font-semibold">Riwayat tindakan</h2>
        {row.audit.map((e) => (
          <p key={e.id} className="break-words text-sm">
            {e.createdAt} · {e.action} · Pengguna #{e.actorId}
          </p>
        ))}
      </section>
    </div>
  );
}
