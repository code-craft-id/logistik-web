import "server-only";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ErrorState } from "@/components/patterns/content-state";
import { FormField } from "@/components/patterns/form-field";
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
import { IdentityError } from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";
import { formatRupiah } from "@/lib/format/rupiah";
import { id, listInput } from "../contracts";
import { accountingQueries, financeService } from "../server/context";
import { FinanceBranchField } from "./branch-field";
import { CommandForm } from "./command-form";
import { FinanceField } from "./fields";
import { InvoiceForm } from "./invoice-form";

export const financeLink =
  "inline-flex min-h-11 items-center rounded-md text-primary underline underline-offset-4";
export async function financeEntry(
  resource: string | readonly string[] = "invoice",
  action = "view",
) {
  const current = await currentIdentity();
  if (!current) redirect("/login");
  return (typeof resource === "string" ? [resource] : resource).some((r) =>
    permits(current.actor, action, r),
  )
    ? current.actor
    : null;
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
    <div className="min-w-0 space-y-5 [overflow-wrap:anywhere]">
      <h1 className="text-xl font-semibold sm:text-2xl">Invoice</h1>
      <nav className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Keuangan">
        {permits(actor, "create", "invoice") && (
          <Link className={financeLink} href="/finance/invoices/new">
            Buat invoice
          </Link>
        )}
        <Link className={financeLink} href="/finance/accounting">
          Akuntansi & laporan
        </Link>
      </nav>
      <form className="grid gap-3 rounded-lg border bg-background p-4 sm:flex sm:flex-wrap sm:items-end">
        <FinanceBranchField
          prefix="invoice-filter"
          optional
          value={input.data.branchId ? String(input.data.branchId) : undefined}
        />
        <Button className="min-h-11" variant="outline" type="submit">
          Terapkan
        </Button>
      </form>
      <p>
        {result.total} invoice. Halaman {result.page}.
      </p>
      {result.items.length ? (
        <Table className="[&_th:last-child]:text-right">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">No.</TableHead>
              {[
                "Customer",
                "Invoice No",
                "Tgl. Dibuat",
                "Termin",
                "Status",
                "Tot. AWB",
                "Cabang",
                "Tagihan IDR",
                "Sisa IDR",
              ].map((v) => (
                <TableHead
                  key={v}
                  className={
                    v.endsWith("IDR") || v === "Tot. AWB" || v === "Termin"
                      ? "text-right"
                      : undefined
                  }
                >
                  {v}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.items.map((r, index) => (
              <TableRow key={r.id}>
                <TableCell className="tabular-nums">
                  {(result.page - 1) * 30 + index + 1}
                </TableCell>
                <TableCell>{r.customerName ?? r.customerId}</TableCell>
                <TableCell>
                  <Link
                    className={financeLink}
                    href={`/finance/invoices/${r.id}`}
                  >
                    {r.number ?? `Draft #${r.id}`}
                  </Link>
                </TableCell>
                <TableCell>{r.invoiceDate}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.termDays} hari
                </TableCell>
                <TableCell>{r.paymentStatus}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.awbCount}
                </TableCell>
                <TableCell>{r.branchName ?? r.branchId}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatRupiah(r.total, { prefix: false })}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatRupiah(r.balance, { prefix: false })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p>Belum ada invoice untuk filter ini.</p>
      )}
      <nav
        className="flex flex-wrap items-center gap-x-4 gap-y-1"
        aria-label="Halaman invoice"
      >
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
    <div className="min-w-0 space-y-5 [overflow-wrap:anywhere]">
      <h1 className="text-xl font-semibold sm:text-2xl">Buat invoice</h1>
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
  // Another branch's invoice or a missing one: same "Data tidak ditemukan"
  // page as the other detail pages (no hint that the record exists).
  const row = await financeService.detail(parsed.data).catch((error) => {
    if (
      error instanceof IdentityError &&
      (error.code === "FORBIDDEN_BRANCH" || error.code === "NOT_FOUND")
    )
      notFound();
    throw error;
  });
  const paymentChoices =
    row.status === "ISSUED" && permits(actor, "create", "payment")
      ? await accountingQueries.paymentChoices()
      : null;
  return (
    <div className="min-w-0 space-y-5 [overflow-wrap:anywhere]">
      <Link className={financeLink} href="/finance/invoices">
        Daftar invoice
      </Link>
      <h1 className="text-xl font-semibold sm:text-2xl">
        {row.number ?? `Draft #${row.id}`}
      </h1>
      <p>
        Cabang {row.issuedBranchName ?? row.branchId} · Pelanggan{" "}
        {row.issuedCustomerName ?? row.customerId} · {row.paymentStatus}
      </p>
      <dl className="grid gap-4 rounded-lg border bg-background p-4 sm:grid-cols-3 [&_dt]:text-sm [&_dt]:text-muted-foreground [&_dd]:mt-1 [&_dd]:font-semibold">
        <div>
          <dt>Tanggal / jatuh tempo</dt>
          <dd>
            {row.invoiceDate} / {row.dueDate}
          </dd>
        </div>
        <div>
          <dt>Tagihan IDR</dt>
          <dd className="tabular-nums">{formatRupiah(row.total)}</dd>
        </div>
        <div>
          <dt>Sisa IDR</dt>
          <dd className="tabular-nums">{formatRupiah(row.balance)}</dd>
        </div>
      </dl>
      <Table className="[&_th:last-child]:text-right">
        <TableHeader>
          <TableRow>
            <TableHead>Sumber transaksi</TableHead>
            <TableHead>Tagihan IDR</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {row.items.map((i) => (
            <TableRow key={i.id}>
              <TableCell>
                {row.issuedSources.find(
                  (s) => s.transactionId === i.transactionId,
                )?.awbNo ?? `Transaksi #${i.transactionId}`}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatRupiah(i.amount, { prefix: false })}
              </TableCell>
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
            <Input
              className="min-h-11"
              required
              name="reason"
              id="voidReason"
              maxLength={500}
            />
          </FormField>
          <FormField id="voidDate" label="Tanggal akuntansi pembatalan">
            <Input
              className="min-h-11"
              required
              type="date"
              name="accountingDate"
              id="voidDate"
            />
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
              ].map(([name, label, type]) => (
                <FormField key={name} id={`receipt-${name}`} label={label}>
                  <Input
                    className="min-h-11"
                    required={name !== "reference"}
                    id={`receipt-${name}`}
                    name={name}
                    type={type}
                    maxLength={160}
                  />
                </FormField>
              ))}
              <FinanceField
                prefix="receipt"
                name="cashAccountId"
                label="Akun kas / bank"
                options={
                  paymentChoices?.accounts.map((a) => ({
                    id: a.id,
                    name: `${a.code} · ${a.name}`,
                  })) ?? []
                }
              />
              <FinanceField
                prefix="receipt"
                name="cashflowCategoryId"
                label="Kategori arus kas"
                options={paymentChoices?.categories ?? []}
              />
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
              <p className="break-words">
                #{r.id} · {r.receivedDate} · {formatRupiah(r.amount)} ·{" "}
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
                        className="min-h-11"
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
                        className="min-h-11"
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
        <h2 className="text-lg font-semibold">
          Riwayat tindakan (200 terbaru)
        </h2>
        {row.audit.map((e) => (
          <p key={e.id} className="break-words text-sm">
            {e.createdAt} · {e.action} · Pengguna #{e.actorId}
            {e.reason ? ` · ${e.reason}` : ""}
          </p>
        ))}
      </section>
    </div>
  );
}
