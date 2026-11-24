import "server-only";
import Link from "next/link";
import type { ReactNode } from "react";
import { ErrorState } from "@/components/patterns/content-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { permits } from "@/features/identity/permissions";
import { IdentityError } from "@/features/identity/server/access";
import { formatRupiah } from "@/lib/format/rupiah";
import { CASH_VOUCHERS, type CashVoucher } from "../accounting-contracts";
import { PAGE_SIZE } from "../server/akunting-queries";
import { akuntingQueries } from "../server/context";
import { CommandForm } from "./command-form";
import { FinanceField } from "./fields";
import { JournalForm } from "./journal-form";
import { financeEntry, financeLink } from "./pages";
import { VoucherForm } from "./voucher-form";

/**
 * Akunting screens following the sandbox menu (OBSERVED newapps
 * 2026-11-24). The real provider app has no Akunting menu, so the sandbox
 * is the reference (user rule 2026-11-24).
 */
type Query = Record<string, string | string[] | undefined>;
const one = (q: Query, key: string) =>
  typeof q[key] === "string" ? (q[key] as string) : undefined;
const rp = (v: string | null | undefined) =>
  v === null || v === undefined ? "-" : formatRupiah(v, { prefix: false });
const denied = (
  <ErrorState
    title="Akses ditolak"
    description="Hubungi administrator untuk hak akses akunting yang sesuai."
  />
);
const SOURCE_LABEL: Record<string, string> = {
  CASH_IN: "Kasir Penerimaan",
  CASH_OUT: "Kasir Pembayaran",
  VENDOR_PAYMENT: "Pembayaran Vendor",
  GENERAL: "Bukti Jurnal Umum",
  MANUAL: "Jurnal Umum",
  MANUAL_REVERSAL: "Balik Jurnal",
  OPENING: "Saldo Awal",
  TRANSFER: "Perpindahan Kas",
  CASH_EXPENSE: "Beban Kas",
  INVOICE: "Invoice",
  INVOICE_VOID: "Void Invoice",
  RECEIPT: "Penerimaan Invoice",
  RECEIPT_REVERSAL: "Batal Penerimaan",
  COST: "Biaya",
  COST_REVERSAL: "Batal Biaya",
};
const label = (s: string) => SOURCE_LABEL[s] ?? s;

function Shell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-5 [overflow-wrap:anywhere]">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Akunting</p>
        <h1 className="text-xl font-semibold sm:text-2xl">{title}</h1>
        {description && (
          <p className="max-w-prose text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

/** Plain GET filter; values stay in the URL like the sandbox Search. */
function Filter({
  children,
  submit = "Search",
}: {
  children: ReactNode;
  submit?: string;
}) {
  return (
    <form className="grid gap-3 rounded-lg border bg-background p-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
      {children}
      <Button className="min-h-11" variant="outline" type="submit">
        {submit}
      </Button>
    </form>
  );
}
function Select({
  name,
  text,
  value,
  options,
  empty = "Semua",
}: {
  name: string;
  text: string;
  value?: string;
  options: { id: number | string; name: string }[];
  empty?: string | null;
}) {
  const id = `f-${name}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{text}</Label>
      <select
        id={id}
        name={name}
        defaultValue={value ?? ""}
        className="min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base md:text-sm"
      >
        {empty !== null && <option value="">{empty}</option>}
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </div>
  );
}
function DateInput({
  name,
  text,
  value,
}: {
  name: string;
  text: string;
  value?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`f-${name}`}>{text}</Label>
      <Input
        className="min-h-11"
        id={`f-${name}`}
        name={name}
        type="date"
        defaultValue={value}
      />
    </div>
  );
}
function Pager({
  page,
  total,
  size,
  query,
}: {
  page: number;
  total: number;
  size: number;
  query: Query;
}) {
  const href = (p: number) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(query))
      if (typeof v === "string" && v && k !== "page") next.set(k, v);
    next.set("page", String(p));
    return `?${next}`;
  };
  return (
    <nav
      className="flex flex-wrap items-center gap-4 text-sm"
      aria-label="Halaman"
    >
      <span>
        Halaman {page} · {total} baris
      </span>
      {page > 1 && (
        <Link className={financeLink} href={href(page - 1)}>
          Sebelumnya
        </Link>
      )}
      {page * size < total && (
        <Link className={financeLink} href={href(page + 1)}>
          Berikutnya
        </Link>
      )}
    </nav>
  );
}
const branchOptions = (rows: { id: number; name: string }[]) =>
  rows.map((b) => ({ id: b.id, name: b.name }));
const accountOptions = (rows: { id: number; code: string; name: string }[]) =>
  rows.map((a) => ({ id: a.id, name: `${a.code} | ${a.name}` }));
async function guard<T>(work: () => Promise<T>) {
  try {
    return { ok: true as const, data: await work() };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof IdentityError
          ? error.message
          : "Data tidak dapat dimuat. Coba lagi.",
    };
  }
}
function Failed({ title, message }: { title: string; message: string }) {
  return (
    <Shell title={title}>
      <p role="alert" className="text-sm text-destructive">
        {message}
      </p>
    </Shell>
  );
}

/* ------------------------------------------------------------------ */
/* Kas Bank: vouchers                                                  */
/* ------------------------------------------------------------------ */

export async function VoucherPage({
  voucher,
  query,
}: {
  voucher: CashVoucher;
  query: Query;
}) {
  const actor = await financeEntry("journal");
  if (!actor) return denied;
  const title = CASH_VOUCHERS[voucher].label;
  const [choices, list] = await Promise.all([
    guard(() => akuntingQueries.choices()),
    guard(() => akuntingQueries.vouchers(voucher, query)),
  ]);
  if (!choices.ok) return <Failed title={title} message={choices.message} />;
  if (!list.ok) return <Failed title={title} message={list.message} />;
  const c = choices.data;
  const canCreate = permits(actor, "create", "journal");
  const canPost = permits(actor, "post", "journal");
  const canReverse = permits(actor, "reverse", "journal");
  return (
    <Shell
      title={title}
      description={
        voucher === "CASH_IN"
          ? "Uang masuk selain pembayaran invoice. Baris berposisi Kredit; Kas/Bank otomatis Debet sebesar total."
          : voucher === "GENERAL"
            ? "Bukti jurnal umum dengan Kas/Bank di sisi Kredit dan akun lawan di baris (Debet)."
            : "Uang keluar. Baris berposisi Debet; Kas/Bank otomatis Kredit sebesar total."
      }
    >
      {canCreate && (
        <section className="rounded-lg border p-4">
          <VoucherForm
            voucher={voucher}
            branches={branchOptions(c.branches)}
            cashAccounts={accountOptions(c.cashAccounts)}
            accounts={accountOptions(c.accounts)}
            costCentres={c.costCentres.map((x) => ({
              id: x.id,
              name: `${x.code} | ${x.name}`,
            }))}
            customers={voucher === "CASH_IN" ? c.customers : undefined}
            vendors={voucher === "VENDOR_PAYMENT" ? c.vendors : undefined}
          />
        </section>
      )}
      <h2 className="text-lg font-semibold">Daftar Nomor Bukti</h2>
      {list.data.items.length === 0 && (
        <p className="text-sm text-muted-foreground">Belum ada bukti.</p>
      )}
      {list.data.items.map((j) => (
        <section key={j.id} className="space-y-3 border-t pt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-semibold">
              {j.reference} · {j.accountingDate}
            </h3>
            <span
              className={
                j.status === "POSTED"
                  ? "text-sm text-muted-foreground"
                  : "text-sm font-medium text-amber-700 dark:text-amber-400"
              }
            >
              {j.status === "POSTED"
                ? "Sudah diposting"
                : "Draft (belum posting)"}
            </span>
          </div>
          <p className="text-sm">
            {j.branch.name}
            {j.costCentre ? ` · Cost Centre ${j.costCentre.code}` : ""}
            {j.customer ? ` · Customer ${j.customer.name}` : ""}
            {j.vendor ? ` · Vendor ${j.vendor.name}` : ""} · {j.reason}
          </p>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode Rekening</TableHead>
                  <TableHead>Nama Perkiraan</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="text-right">Debet</TableHead>
                  <TableHead className="text-right">Kredit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {j.lines.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>{l.account.code}</TableCell>
                    <TableCell>{l.account.name}</TableCell>
                    <TableCell>{l.memo ?? "-"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {rp(l.debit)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {rp(l.credit)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <JournalActions
            journal={j}
            canPost={canPost}
            canCreate={canCreate}
            canReverse={canReverse}
          />
        </section>
      ))}
      <Pager
        page={list.data.page}
        total={list.data.total}
        size={20}
        query={query}
      />
    </Shell>
  );
}

function JournalActions({
  journal,
  canPost,
  canCreate,
  canReverse,
}: {
  journal: {
    id: number;
    status: string;
    sourceType: string;
    reference: string;
    reversalOfId?: number | null;
    reversed?: boolean;
  };
  canPost: boolean;
  canCreate: boolean;
  canReverse: boolean;
}) {
  const own =
    journal.sourceType === "MANUAL" || journal.sourceType in CASH_VOUCHERS;
  if (journal.status === "DRAFT" && own)
    return (
      <div className="flex flex-wrap gap-3">
        {canPost && (
          <CommandForm
            label={`Posting ${journal.reference}`}
            values={{ action: "journal.post", id: journal.id }}
          />
        )}
        {canCreate && (
          <CommandForm
            label={`Hapus Nomor Bukti ${journal.reference}`}
            values={{ action: "journal.discard", id: journal.id }}
          />
        )}
      </div>
    );
  if (
    journal.status === "POSTED" &&
    !journal.reversed &&
    !journal.reversalOfId &&
    (own ||
      ["CASH_EXPENSE", "TRANSFER", "OPENING"].includes(journal.sourceType)) &&
    canReverse
  )
    return (
      <details>
        <summary className="min-h-11 cursor-pointer py-2 text-sm">
          Balik jurnal {journal.reference}
        </summary>
        <CommandForm
          label={`Balikkan ${journal.reference}`}
          values={{ action: "journal.reverse", id: journal.id }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <FinanceField
              prefix={`rev-${journal.id}`}
              name="accountingDate"
              label="Tanggal pembalikan"
              type="date"
            />
            <FinanceField
              prefix={`rev-${journal.id}`}
              name="reason"
              label="Alasan"
            />
          </div>
        </CommandForm>
      </details>
    );
  return null;
}

/* ------------------------------------------------------------------ */
/* Kasir (List Posting), Memorial, Penyesuaian Penjualan               */
/* ------------------------------------------------------------------ */

const POSTING_VIEWS = {
  posting: {
    title: "Kasir (List Posting)",
    description:
      "Semua jurnal dan bukti kas. Draft diposting atau dihapus dari sini; jurnal terposting dikoreksi dengan balik jurnal.",
    types: undefined,
  },
  memorial: {
    title: "Memorial (Histori Jurnal Umum)",
    description:
      "Riwayat jurnal umum, bukti jurnal umum, saldo awal dan balik jurnal.",
    types: [
      "MANUAL",
      "MANUAL_REVERSAL",
      "GENERAL",
      "OPENING",
      "TRANSFER",
      "CASH_EXPENSE",
    ],
  },
  adjustment: {
    title: "Penyesuaian Penjualan",
    description:
      "Penyesuaian atas penjualan: void invoice dan pembatalan penerimaan invoice (dibuat dari menu Invoice).",
    types: ["INVOICE_VOID", "RECEIPT_REVERSAL"],
  },
} as const;

export async function PostingListPage({
  view,
  query,
}: {
  view: keyof typeof POSTING_VIEWS;
  query: Query;
}) {
  const actor = await financeEntry("journal");
  if (!actor) return denied;
  const cfg = POSTING_VIEWS[view];
  const [result, choices] = await Promise.all([
    guard(() =>
      akuntingQueries.postings(query, cfg.types ? [...cfg.types] : undefined),
    ),
    guard(() => akuntingQueries.choices()),
  ]);
  if (!result.ok) return <Failed title={cfg.title} message={result.message} />;
  if (!choices.ok)
    return <Failed title={cfg.title} message={choices.message} />;
  const types = (cfg.types ?? Object.keys(SOURCE_LABEL)).map((t) => ({
    id: t,
    name: label(t),
  }));
  const seen = new Set<number>();
  return (
    <Shell title={cfg.title} description={cfg.description}>
      <Filter>
        <Select
          name="branchId"
          text="Cabang"
          value={one(query, "branchId")}
          options={branchOptions(choices.data.branches)}
        />
        <Select
          name="sourceType"
          text="Tipe Jurnal"
          value={one(query, "sourceType")}
          options={types}
        />
        <Select
          name="status"
          text="Status"
          value={one(query, "status")}
          options={[
            { id: "DRAFT", name: "Draft" },
            { id: "POSTED", name: "Posted" },
          ]}
        />
        <div className="space-y-2">
          <Label htmlFor="f-reference">Nomor Bukti</Label>
          <Input
            className="min-h-11"
            id="f-reference"
            name="reference"
            defaultValue={one(query, "reference")}
          />
        </div>
        <DateInput name="start" text="Dari" value={one(query, "start")} />
        <DateInput name="end" text="S/d" value={one(query, "end")} />
      </Filter>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipe Jurnal</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Nomor Bukti</TableHead>
              <TableHead>Source No</TableHead>
              <TableHead>Kode Rekening</TableHead>
              <TableHead>Nama Rekening</TableHead>
              <TableHead>Keterangan</TableHead>
              <TableHead className="text-right">Debet</TableHead>
              <TableHead className="text-right">Kredit</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-muted-foreground">
                  Tidak ada data untuk filter ini.
                </TableCell>
              </TableRow>
            )}
            {result.data.items.map((r) => (
              <TableRow key={r.lineId}>
                <TableCell>{label(r.sourceType)}</TableCell>
                <TableCell>{r.accountingDate}</TableCell>
                <TableCell>{r.reference}</TableCell>
                <TableCell>{r.sourceId ?? "-"}</TableCell>
                <TableCell>{r.code}</TableCell>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.memo ?? r.reason}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {rp(r.debit)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {rp(r.credit)}
                </TableCell>
                <TableCell>
                  {r.status === "POSTED"
                    ? r.reversed
                      ? "Posted (dibalik)"
                      : "Posted"
                    : "Draft"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Pager
        page={result.data.page}
        total={result.data.total}
        size={PAGE_SIZE}
        query={query}
      />
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Aksi per Nomor Bukti</h2>
        {result.data.items
          .filter((r) => {
            if (seen.has(r.journalId)) return false;
            seen.add(r.journalId);
            return true;
          })
          .map((r) => (
            <JournalActions
              key={r.journalId}
              journal={{
                id: r.journalId,
                status: r.status,
                sourceType: r.sourceType,
                reference: r.reference,
                reversalOfId: r.reversalOfId,
                reversed: r.reversed,
              }}
              canPost={permits(actor, "post", "journal")}
              canCreate={permits(actor, "create", "journal")}
              canReverse={permits(actor, "reverse", "journal")}
            />
          ))}
      </section>
    </Shell>
  );
}

/* ------------------------------------------------------------------ */
/* Bukti Jurnal Umum with free lines (general journal draft)           */
/* ------------------------------------------------------------------ */

export async function GeneralJournalPage({ query }: { query: Query }) {
  const actor = await financeEntry("journal");
  if (!actor) return denied;
  const choices = await guard(() => akuntingQueries.choices());
  if (!choices.ok)
    return <Failed title="Bukti Jurnal Umum" message={choices.message} />;
  return (
    <div className="space-y-8">
      <VoucherPage voucher="GENERAL" query={query} />
      {permits(actor, "create", "journal") && (
        <Shell
          title="Jurnal umum tanpa Kas/Bank (Memorial)"
          description="Untuk penyesuaian antar akun non-kas: isi baris Debet dan Kredit yang seimbang, simpan draft, lalu posting di Kasir."
        >
          <JournalForm
            branches={branchOptions(choices.data.branches)}
            accounts={accountOptions(
              choices.data.accounts.filter((a) => !a.isCash),
            )}
          />
        </Shell>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Kasir Penerimaan Invoice                                            */
/* ------------------------------------------------------------------ */

export async function InvoiceReceiptPage({ query }: { query: Query }) {
  const actor = await financeEntry(["journal", "invoice"]);
  if (!actor) return denied;
  const result = await guard(() =>
    akuntingQueries.postings(
      { ...query, sourceType: one(query, "sourceType") ?? "" },
      ["RECEIPT", "RECEIPT_REVERSAL"],
    ),
  );
  return (
    <Shell
      title="Kasir Penerimaan Invoice"
      description="Penerimaan pembayaran invoice customer. Pilih invoice yang belum lunas, lalu isi Terima Pembayaran (Kas/Bank, tanggal, jumlah). Jurnal Kas/Bank (D) dan Piutang (K) terposting otomatis."
    >
      <div className="flex flex-wrap gap-3">
        <Button asChild className="min-h-11">
          <Link href="/finance/invoices?payment=OUTSTANDING">
            Pilih invoice belum lunas
          </Link>
        </Button>
        <Button asChild variant="outline" className="min-h-11">
          <Link href="/financial-reports/aging">Laporan AR</Link>
        </Button>
      </div>
      {!result.ok ? (
        <p role="alert" className="text-sm text-destructive">
          {result.message}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Nomor Bukti</TableHead>
                <TableHead>Kode Rekening</TableHead>
                <TableHead>Nama Perkiraan</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead>Posisi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">
                    Belum ada penerimaan invoice.
                  </TableCell>
                </TableRow>
              )}
              {result.data.items.map((r) => (
                <TableRow key={r.lineId}>
                  <TableCell>{r.accountingDate}</TableCell>
                  <TableCell>{r.reference}</TableCell>
                  <TableCell>{r.code}</TableCell>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.reason}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {rp(Number(r.debit) > 0 ? r.debit : r.credit)}
                  </TableCell>
                  <TableCell>{Number(r.debit) > 0 ? "D" : "K"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Shell>
  );
}

/* ------------------------------------------------------------------ */
/* Buku Bank / Buku Besar                                              */
/* ------------------------------------------------------------------ */

export async function AccountBookPage({
  cashOnly,
  query,
}: {
  cashOnly: boolean;
  query: Query;
}) {
  const title = cashOnly ? "Buku Bank" : "Buku Besar";
  const actor = await financeEntry("financial_report");
  if (!actor) return denied;
  const result = await guard(() =>
    akuntingQueries.accountBook(query, cashOnly),
  );
  if (!result.ok) return <Failed title={title} message={result.message} />;
  const r = result.data;
  return (
    <Shell
      title={title}
      description={
        cashOnly
          ? "Mutasi akun Kas/Bank dengan saldo berjalan (jurnal terposting)."
          : "Mutasi satu akun dengan saldo awal dan saldo berjalan (jurnal terposting)."
      }
    >
      <Filter>
        <Select
          name="accountId"
          text="Akun"
          value={one(query, "accountId") ?? String(r.book?.account.id ?? "")}
          options={accountOptions(r.accounts)}
          empty={null}
        />
        <Select
          name="branchId"
          text="Cabang"
          value={one(query, "branchId")}
          options={branchOptions(r.branches)}
        />
        {!cashOnly && (
          <Select
            name="costCentreId"
            text="Cost Centre"
            value={one(query, "costCentreId")}
            options={accountOptions(r.costCentres)}
          />
        )}
        <DateInput name="start" text="Dari" value={r.start} />
        <DateInput name="end" text="S/d" value={r.end} />
      </Filter>
      {!r.book ? (
        <p className="text-sm text-muted-foreground">
          {cashOnly
            ? "Belum ada akun Kas/Bank. Tandai akun sebagai kas/bank di Data Akun."
            : "Pilih akun."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Nomor Bukti</TableHead>
                {cashOnly && <TableHead>Kode / Nama Rekening Lawan</TableHead>}
                <TableHead>Keterangan</TableHead>
                <TableHead className="text-right">Debet</TableHead>
                <TableHead className="text-right">Kredit</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={cashOnly ? 6 : 5}>
                  Saldo awal {r.book.account.code} {r.book.account.name}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {rp(r.book.opening)}
                </TableCell>
              </TableRow>
              {r.book.items.map((row) => (
                <TableRow key={row.lineId}>
                  <TableCell>{row.accountingDate}</TableCell>
                  <TableCell>{row.reference}</TableCell>
                  {cashOnly && <TableCell>{row.counter ?? "-"}</TableCell>}
                  <TableCell>{row.memo ?? row.reason}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {rp(row.debit)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {rp(row.credit)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {rp(row.balance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={cashOnly ? 6 : 5}>Saldo akhir</TableCell>
                <TableCell className="text-right tabular-nums">
                  {rp(r.book.closing)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
          {r.book.truncated && (
            <p className="text-sm text-muted-foreground">
              Ditampilkan 2.000 baris pertama; persempit periode.
            </p>
          )}
        </div>
      )}
    </Shell>
  );
}

/* ------------------------------------------------------------------ */
/* Neraca Saldo / Neraca                                               */
/* ------------------------------------------------------------------ */

function PeriodFilter({
  query,
  start,
  end,
  branches,
  costCentres,
  withLevel,
}: {
  query: Query;
  start?: string;
  end: string;
  branches: { id: number; name: string }[];
  costCentres: { id: number; code: string; name: string }[];
  withLevel: boolean;
}) {
  return (
    <Filter>
      <Select
        name="branchId"
        text="Cabang"
        value={one(query, "branchId")}
        options={branchOptions(branches)}
      />
      <Select
        name="costCentreId"
        text="Cost Centre"
        value={one(query, "costCentreId")}
        options={accountOptions(costCentres)}
      />
      {start !== undefined && (
        <DateInput name="start" text="Tgl. Periode dari" value={start} />
      )}
      <DateInput
        name="end"
        text={start !== undefined ? "S/d" : "Per tanggal"}
        value={end}
      />
      {withLevel && (
        <Select
          name="level"
          text="Tampil"
          value={one(query, "level")}
          options={[
            { id: "parent", name: "Tampil Induk" },
            { id: "child", name: "Tampil Anak" },
          ]}
          empty="Induk & Anak"
        />
      )}
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="includeZero"
          defaultChecked={one(query, "includeZero") === "on"}
          className="h-4 w-4"
        />
        Masukan Saldo Kosong
      </label>
    </Filter>
  );
}

export async function TrialBalancePage({ query }: { query: Query }) {
  const actor = await financeEntry("financial_report");
  if (!actor) return denied;
  const result = await guard(() => akuntingQueries.trialBalance(query));
  if (!result.ok)
    return <Failed title="Neraca Saldo" message={result.message} />;
  const r = result.data;
  return (
    <Shell
      title="Neraca Saldo"
      description="Daftar neraca percobaan: saldo awal, mutasi debet/kredit dan saldo per akun. Akun induk menjumlahkan akun anaknya."
    >
      <PeriodFilter
        query={query}
        start={r.start}
        end={r.end}
        branches={r.branches}
        costCentres={r.costCentres}
        withLevel
      />
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode Akun</TableHead>
              <TableHead>Nama Akun</TableHead>
              <TableHead className="text-right">Saldo Awal Debet</TableHead>
              <TableHead className="text-right">Saldo Awal Kredit</TableHead>
              <TableHead className="text-right">Mutasi Debet</TableHead>
              <TableHead className="text-right">Mutasi Kredit</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {r.rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  Tidak ada saldo pada periode ini.
                </TableCell>
              </TableRow>
            )}
            {r.rows.map((row) => (
              <TableRow
                key={row.id}
                className={row.isParent ? "font-semibold" : undefined}
              >
                <TableCell>{row.code}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {rp(row.openDebit)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {rp(row.openCredit)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {rp(row.debit)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {rp(row.credit)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {rp(row.balance)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2}>Total (akun anak)</TableCell>
              <TableCell className="text-right tabular-nums">
                {rp(r.totals.openDebit)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {rp(r.totals.openCredit)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {rp(r.totals.debit)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {rp(r.totals.credit)}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </Shell>
  );
}

function SideTable({
  title,
  rows,
  total,
  extra,
}: {
  title: string;
  rows: { code: string; name: string; parent: string; amount: string }[];
  total: string;
  extra?: ReactNode;
}) {
  return (
    <div className="min-w-0 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead colSpan={3}>{title}</TableHead>
          </TableRow>
          <TableRow>
            <TableHead>Keterangan</TableHead>
            <TableHead>Kode Akun Induk</TableHead>
            <TableHead className="text-right">Jumlah</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.code}>
              <TableCell>
                {r.code} {r.name}
              </TableCell>
              <TableCell>{r.parent || "-"}</TableCell>
              <TableCell className="text-right tabular-nums">
                {rp(r.amount)}
              </TableCell>
            </TableRow>
          ))}
          {extra}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>Total {title}</TableCell>
            <TableCell className="text-right tabular-nums">
              {rp(total)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}

export async function BalanceSheetPage({ query }: { query: Query }) {
  const actor = await financeEntry("financial_report");
  if (!actor) return denied;
  const result = await guard(() => akuntingQueries.balanceSheet(query));
  if (!result.ok) return <Failed title="Neraca" message={result.message} />;
  const r = result.data;
  return (
    <Shell
      title="Neraca"
      description="AKTIVA dan PASSIVA per tanggal. Laba (rugi) berjalan = pendapatan dikurangi beban yang belum ditutup ke ekuitas."
    >
      <PeriodFilter
        query={query}
        end={r.end}
        branches={r.branches}
        costCentres={r.costCentres}
        withLevel={false}
      />
      {!r.balanced && (
        <p role="alert" className="text-sm text-destructive">
          Total AKTIVA dan PASSIVA belum sama. Periksa saldo awal akun.
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <SideTable title="AKTIVA" rows={r.aktiva} total={r.totalAktiva} />
        <SideTable
          title="PASSIVA"
          rows={[...r.kewajiban, ...r.ekuitas]}
          total={r.totalPassiva}
          extra={
            <TableRow>
              <TableCell>Laba (rugi) berjalan</TableCell>
              <TableCell>-</TableCell>
              <TableCell className="text-right tabular-nums">
                {rp(r.labaBerjalan)}
              </TableCell>
            </TableRow>
          }
        />
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------------------ */
/* Rekonsiliasi Bank                                                   */
/* ------------------------------------------------------------------ */

export async function ReconciliationPage({ query }: { query: Query }) {
  const actor = await financeEntry("journal");
  if (!actor) return denied;
  const result = await guard(() => akuntingQueries.reconciliation(query));
  if (!result.ok)
    return <Failed title="Rekonsiliasi Bank" message={result.message} />;
  const r = result.data;
  const canPost = permits(actor, "post", "journal");
  return (
    <Shell
      title="Rekonsiliasi Bank (Kas & Bank)"
      description="Bandingkan saldo di sistem dengan saldo di rekening koran. Isi Saldo di Bank per tanggal; selisih tampil otomatis."
    >
      <Filter>
        <Select
          name="branchId"
          text="Cabang"
          value={String(r.branchId ?? "")}
          options={branchOptions(r.branches)}
          empty={null}
        />
        <DateInput name="end" text="Per tanggal" value={r.end} />
      </Filter>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode Rekening</TableHead>
              <TableHead>Nama Rekening</TableHead>
              <TableHead className="text-right">Saldo di Sistem</TableHead>
              <TableHead className="text-right">Saldo di Bank</TableHead>
              <TableHead>Tgl. Rekening Koran</TableHead>
              <TableHead className="text-right">Selisih</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {r.rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  Belum ada akun Kas/Bank.
                </TableCell>
              </TableRow>
            )}
            {r.rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.code}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {rp(row.system)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {rp(row.bank)}
                </TableCell>
                <TableCell>{row.statementDate ?? "-"}</TableCell>
                <TableCell
                  className={`text-right tabular-nums ${row.difference && Number(row.difference) !== 0 ? "text-destructive" : ""}`}
                >
                  {rp(row.difference)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {canPost && r.branchId && r.rows.length > 0 && (
        <section className="max-w-xl space-y-3 rounded-lg border p-4">
          <h2 className="font-semibold">Isi Saldo di Bank</h2>
          <CommandForm
            label="Simpan saldo bank"
            values={{ action: "journal.bank_statement", branchId: r.branchId }}
          >
            <FinanceField
              prefix="recon"
              name="accountId"
              label="Akun Kas/Bank"
              options={r.rows.map((x) => ({
                id: x.id,
                name: `${x.code} | ${x.name}`,
              }))}
            />
            <FinanceField
              prefix="recon"
              name="statementDate"
              label="Tanggal rekening koran"
              type="date"
              value={r.end}
            />
            <FinanceField
              prefix="recon"
              name="bankBalance"
              label="Saldo di Bank (Rp, titik untuk desimal)"
            />
            <FinanceField prefix="recon" name="note" label="Catatan" optional />
          </CommandForm>
        </section>
      )}
    </Shell>
  );
}

/* ------------------------------------------------------------------ */
/* Masters: Cost Centre, Kategori Assets, Assets, GL, PL, Arus Kas     */
/* ------------------------------------------------------------------ */

const yesNo = [
  { id: "true", name: "Aktif" },
  { id: "false", name: "Nonaktif" },
];

export async function CostCentrePage() {
  const actor = await financeEntry("finance_account");
  if (!actor) return denied;
  const result = await guard(() => akuntingQueries.masters());
  if (!result.ok)
    return <Failed title="Cost Centre" message={result.message} />;
  const r = result.data;
  const manage = permits(actor, "manage", "finance_account");
  const fields = (prefix: string, c?: (typeof r.costCentres)[number]) => (
    <div className="grid gap-3 sm:grid-cols-2">
      <FinanceField
        prefix={prefix}
        name="code"
        label="Kode Cost Centre"
        value={c?.code}
      />
      <FinanceField
        prefix={prefix}
        name="name"
        label="Nama Cost Centre"
        value={c?.name}
      />
      <FinanceField
        prefix={prefix}
        name="branchId"
        label="Cabang"
        options={branchOptions(r.branches)}
        value={c?.branchId}
      />
      <FinanceField
        prefix={prefix}
        name="active"
        label="Status"
        options={yesNo}
        value={String(c?.active ?? true)}
      />
    </div>
  );
  return (
    <Shell
      title="Cost Centre"
      description="Pusat biaya per cabang. Dipakai di Kasir dan filter laporan (Buku Besar, Neraca, Neraca Saldo)."
    >
      {manage && (
        <details className="rounded-lg border p-4">
          <summary className="min-h-11 cursor-pointer py-2 font-medium">
            Add
          </summary>
          <CommandForm
            label="Simpan"
            values={{ action: "finance_account.cost_centre" }}
          >
            {fields("cc-new")}
          </CommandForm>
        </details>
      )}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode Cost Centre</TableHead>
              <TableHead>Nama Cost Centre</TableHead>
              <TableHead>Cabang Cost Centre</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {r.costCentres.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  Belum ada cost centre.
                </TableCell>
              </TableRow>
            )}
            {r.costCentres.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.code}</TableCell>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.branch.name}</TableCell>
                <TableCell>{c.active ? "Aktif" : "Nonaktif"}</TableCell>
                <TableCell>
                  {manage && (
                    <details>
                      <summary className="min-h-11 cursor-pointer py-2">
                        Edit
                      </summary>
                      <CommandForm
                        label="Update"
                        values={{
                          action: "finance_account.cost_centre",
                          id: c.id,
                        }}
                      >
                        {fields(`cc-${c.id}`, c)}
                      </CommandForm>
                    </details>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Shell>
  );
}

export async function AssetCategoryPage() {
  const actor = await financeEntry("finance_account");
  if (!actor) return denied;
  const result = await guard(() => akuntingQueries.masters());
  if (!result.ok)
    return <Failed title="Kategori Assets" message={result.message} />;
  const r = result.data;
  const manage = permits(actor, "manage", "finance_account");
  const assetAccounts = accountOptions(
    r.accounts.filter((a) => a.kind === "ASSET"),
  );
  const all = accountOptions(r.accounts);
  const fields = (prefix: string, c?: (typeof r.categories)[number]) => (
    <div className="grid gap-3 sm:grid-cols-2">
      <FinanceField
        prefix={prefix}
        name="name"
        label="Nama Kategori"
        value={c?.name}
      />
      <FinanceField
        prefix={prefix}
        name="accountId"
        label="COA (akun aset)"
        options={assetAccounts}
        value={c?.accountId}
      />
      <FinanceField
        prefix={prefix}
        name="counterAccountId"
        label="COA Lawan (akumulasi / beban penyusutan)"
        options={all}
        value={c?.counterAccountId}
      />
      <FinanceField
        prefix={prefix}
        name="active"
        label="Status"
        options={yesNo}
        value={String(c?.active ?? true)}
      />
    </div>
  );
  return (
    <Shell
      title="Kategori Assets"
      description="Kelompok aset tetap dengan akun COA dan COA lawannya."
    >
      {manage && (
        <details className="rounded-lg border p-4">
          <summary className="min-h-11 cursor-pointer py-2 font-medium">
            Add
          </summary>
          <CommandForm
            label="Simpan"
            values={{ action: "finance_account.asset_category" }}
          >
            {fields("ac-new")}
          </CommandForm>
        </details>
      )}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unique ID</TableHead>
              <TableHead>Nama Kategori</TableHead>
              <TableHead>COA</TableHead>
              <TableHead>COA Lawan</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {r.categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  Belum ada kategori aset.
                </TableCell>
              </TableRow>
            )}
            {r.categories.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.id}</TableCell>
                <TableCell>
                  {c.name}
                  {!c.active && " (nonaktif)"}
                </TableCell>
                <TableCell>
                  {c.account.code} | {c.account.name}
                </TableCell>
                <TableCell>
                  {c.counterAccount.code} | {c.counterAccount.name}
                </TableCell>
                <TableCell>
                  {manage && (
                    <details>
                      <summary className="min-h-11 cursor-pointer py-2">
                        Edit
                      </summary>
                      <CommandForm
                        label="Update"
                        values={{
                          action: "finance_account.asset_category",
                          id: c.id,
                        }}
                      >
                        {fields(`ac-${c.id}`, c)}
                      </CommandForm>
                    </details>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Shell>
  );
}

export async function AssetsPage() {
  const actor = await financeEntry("finance_account");
  if (!actor) return denied;
  const result = await guard(() => akuntingQueries.masters());
  if (!result.ok) return <Failed title="Assets" message={result.message} />;
  const r = result.data;
  const manage = permits(actor, "manage", "finance_account");
  const categories = r.categories
    .filter((c) => c.active)
    .map((c) => ({ id: c.id, name: c.name }));
  const fields = (prefix: string, a?: (typeof r.assets)[number]) => (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <FinanceField
        prefix={prefix}
        name="name"
        label="Jenis Aktiva"
        value={a?.name}
      />
      <FinanceField
        prefix={prefix}
        name="categoryId"
        label="Kategori"
        options={categories}
        value={a?.categoryId}
      />
      <FinanceField
        prefix={prefix}
        name="branchId"
        label="Cabang"
        options={branchOptions(r.branches)}
        value={a?.branchId ?? undefined}
        optional
        emptyLabel="Nasional"
      />
      <FinanceField
        prefix={prefix}
        name="units"
        label="Unit"
        type="number"
        value={a?.units ?? 1}
      />
      <FinanceField
        prefix={prefix}
        name="acquiredOn"
        label="Tgl Perolehan"
        type="date"
        value={a?.acquiredOn}
      />
      <FinanceField
        prefix={prefix}
        name="cost"
        label="Hrg Perolehan (Rp)"
        value={a?.cost}
      />
      <FinanceField
        prefix={prefix}
        name="groupLabel"
        label="Kel (kelompok)"
        value={a?.groupLabel ?? undefined}
        optional
      />
      <FinanceField
        prefix={prefix}
        name="additions"
        label="Penambahan (Rp)"
        value={a?.additions ?? "0"}
      />
      <FinanceField
        prefix={prefix}
        name="reductions"
        label="Pengurangan (Rp)"
        value={a?.reductions ?? "0"}
      />
      <FinanceField
        prefix={prefix}
        name="lifeMonths"
        label="Masa (Bulan)"
        type="number"
        value={a?.lifeMonths}
      />
      <FinanceField
        prefix={prefix}
        name="note"
        label="Keterangan"
        value={a?.note ?? undefined}
        optional
      />
    </div>
  );
  return (
    <Shell
      title="Assets"
      description={`Daftar aktiva tetap. Penyusutan garis lurus per bulan dihitung otomatis sampai ${r.today} (tampilan; belum diposting ke jurnal).`}
    >
      {manage && categories.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Buat Kategori Assets lebih dulu (Akunting &gt; Master &gt; Kategori
          Assets).
        </p>
      )}
      {manage && categories.length > 0 && (
        <details className="rounded-lg border p-4">
          <summary className="min-h-11 cursor-pointer py-2 font-medium">
            Add
          </summary>
          <CommandForm
            label="Simpan"
            values={{ action: "finance_account.asset" }}
          >
            {fields("as-new")}
          </CommandForm>
        </details>
      )}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jenis Aktiva</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Tgl Perolehan</TableHead>
              <TableHead className="text-right">Hrg Perolehan</TableHead>
              <TableHead>Kel</TableHead>
              <TableHead className="text-right">Penambahan</TableHead>
              <TableHead className="text-right">Pengurangan</TableHead>
              <TableHead>Masa (Bulan)</TableHead>
              <TableHead className="text-right">Penyusutan/Bulan</TableHead>
              <TableHead className="text-right">Akumulasi</TableHead>
              <TableHead className="text-right">Nilai Buku</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {r.assets.length === 0 && (
              <TableRow>
                <TableCell colSpan={13} className="text-muted-foreground">
                  Belum ada aset.
                </TableCell>
              </TableRow>
            )}
            {r.assets.map((a) => (
              <TableRow key={a.id}>
                <TableCell>
                  {a.name}
                  {a.branch ? ` · ${a.branch.name}` : ""}
                </TableCell>
                <TableCell>{a.category.name}</TableCell>
                <TableCell>{a.units}</TableCell>
                <TableCell>{a.acquiredOn}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {rp(a.cost)}
                </TableCell>
                <TableCell>{a.groupLabel ?? "-"}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {rp(a.additions)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {rp(a.reductions)}
                </TableCell>
                <TableCell>
                  {a.lifeMonths} ({a.elapsed} berjalan)
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {rp(a.monthly)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {rp(a.accumulated)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {rp(a.bookValue)}
                </TableCell>
                <TableCell>
                  {manage && (
                    <div className="space-y-2">
                      <details>
                        <summary className="min-h-11 cursor-pointer py-2">
                          Edit
                        </summary>
                        <CommandForm
                          label="Update"
                          values={{ action: "finance_account.asset", id: a.id }}
                        >
                          {fields(`as-${a.id}`, a)}
                        </CommandForm>
                      </details>
                      <CommandForm
                        label="Hapus"
                        values={{
                          action: "finance_account.asset_remove",
                          id: a.id,
                        }}
                      />
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Shell>
  );
}

const POSISI: Record<string, string> = {
  ASSET: "AKTIVA",
  LIABILITY: "KEWAJIBAN",
  EQUITY: "EKUITAS",
  REVENUE: "LABA",
  EXPENSE: "RUGI",
};

/** General Ledger: Buku Besar induk = accounts without Induk. */
export async function GeneralLedgerMasterPage() {
  const actor = await financeEntry("finance_account");
  if (!actor) return denied;
  const result = await guard(() => akuntingQueries.masters());
  if (!result.ok) return <Failed title="Buku Besar" message={result.message} />;
  const roots = result.data.accounts.filter((a) => !a.parentId);
  return (
    <Shell
      title="General Ledger (Buku Besar)"
      description="Akun buku besar adalah akun tanpa Induk. Tambah atau ubah lewat Data Akun (kosongkan kolom Induk)."
    >
      {permits(actor, "manage", "finance_account") && (
        <Button asChild className="min-h-11">
          <Link href="/finance/accounting/accounts">Tambah di Data Akun</Link>
        </Button>
      )}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No</TableHead>
              <TableHead>Nomor Buku Besar</TableHead>
              <TableHead>Nama Buku Besar</TableHead>
              <TableHead>Posisi</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roots.map((a, index) => (
              <TableRow key={a.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{a.code}</TableCell>
                <TableCell>{a.name}</TableCell>
                <TableCell>{POSISI[a.kind] ?? a.kind}</TableCell>
                <TableCell>
                  <Link
                    className={financeLink}
                    href={`/akunting/buku-besar?accountId=${a.id}`}
                  >
                    Lihat mutasi
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Shell>
  );
}

/** Master Rugi Laba: revenue/expense accounts with their Kategori Rugi Laba. */
export async function ProfitLossMasterPage() {
  const actor = await financeEntry("finance_account");
  if (!actor) return denied;
  const result = await guard(() => akuntingQueries.masters());
  if (!result.ok)
    return <Failed title="Master Rugi Laba" message={result.message} />;
  const rows = result.data.accounts.filter(
    (a) => a.kind === "REVENUE" || a.kind === "EXPENSE",
  );
  return (
    <Shell
      title="Daftar Master Rugi Laba"
      description="Akun pendapatan dan beban beserta Kategori Rugi Laba-nya (dipakai Hitung Rugi Laba). Atur kategori di Data Akun, kolom Rugi Laba."
    >
      {permits(actor, "manage", "finance_account") && (
        <Button asChild className="min-h-11">
          <Link href="/finance/accounting/accounts">
            Tambah / ubah di Data Akun
          </Link>
        </Button>
      )}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Posisi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((a) => (
              <TableRow key={a.id}>
                <TableCell>
                  {a.code} | {a.name}
                </TableCell>
                <TableCell>{a.plCategory?.name ?? "-"}</TableCell>
                <TableCell>{POSISI[a.kind]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Shell>
  );
}
