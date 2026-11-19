import "server-only";
import Link from "next/link";
import type { ReactNode } from "react";
import { ErrorState } from "@/components/patterns/content-state";
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
import { formatRupiah } from "@/lib/format/rupiah";
import { reportInput } from "../accounting-contracts";
import { costListInput, listInput } from "../contracts";
import { accountingQueries } from "../server/context";
import { FinanceBranchField, journalFormChoices } from "./branch-field";
import { CommandForm } from "./command-form";
import { FinanceField } from "./fields";
import { JournalForm } from "./journal-form";
import { financeEntry, financeLink } from "./pages";

type Query = Record<string, string | string[] | undefined>;
const denied = (
  <ErrorState
    title="Akses ditolak"
    description="Hubungi administrator untuk hak akses keuangan yang sesuai."
  />
);
const kinds = ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"].map(
  (id) => ({ id, name: id }),
);
const bool = [
  { id: "true", name: "Ya" },
  { id: "false", name: "Tidak" },
];
const categories = [
  { id: "ACCOUNT", name: "Akun" },
  { id: "CASHFLOW", name: "Arus kas" },
];
const flows = ["OPERATING", "INVESTING", "FINANCING"].map((id) => ({
  id,
  name: id,
}));
const links = [
  ["accounts", "Akun & kategori"],
  ["journals", "Jurnal"],
  ["costs", "Biaya aktual"],
  ["periods", "Periode"],
  ["reports", "P&L, GP & arus kas"],
];
function Workspace({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-5 [overflow-wrap:anywhere]">
      <h1 className="text-xl font-semibold sm:text-2xl">{title}</h1>
      <nav
        className="flex flex-wrap gap-x-5 gap-y-1 border-b pb-2"
        aria-label="Keuangan"
      >
        <Link className={financeLink} href="/finance/invoices">
          Invoice
        </Link>
        {links.map(([path, label]) => (
          <Link
            key={path}
            className={financeLink}
            href={`/finance/accounting/${path}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
function Filter({ query, dates = false }: { query: Query; dates?: boolean }) {
  return (
    <form className="grid gap-3 rounded-lg border bg-background p-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
      <FinanceBranchField
        prefix="filter"
        optional={!dates}
        value={typeof query.branchId === "string" ? query.branchId : undefined}
      />
      {dates && (
        <>
          <FinanceField
            prefix="filter"
            name="start"
            label="Dari tanggal"
            type="date"
            value={typeof query.start === "string" ? query.start : undefined}
          />
          <FinanceField
            prefix="filter"
            name="end"
            label="Sampai tanggal"
            type="date"
            value={typeof query.end === "string" ? query.end : undefined}
          />
        </>
      )}
      <Button className="min-h-11" variant="outline" type="submit">
        Tampilkan
      </Button>
    </form>
  );
}
function Pages({
  page,
  total,
  query,
  param = "page",
}: {
  page: number;
  total: number;
  query: Query;
  /** Query key this pager drives; other list keys on the page are preserved. */
  param?: "page" | "eventPage";
}) {
  const href = (target: number) => {
    const next = new URLSearchParams();
    for (const key of ["branchId", "page", "eventPage"]) {
      const value = query[key];
      if (typeof value === "string" && value) next.set(key, value);
    }
    next.set(param, String(target));
    return `?${next}`;
  };
  return (
    <nav
      className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm"
      aria-label={param === "eventPage" ? "Halaman peristiwa biaya" : "Halaman"}
    >
      <span>
        Halaman {page} · {total} catatan
      </span>
      {page > 1 && (
        <Link className={financeLink} href={href(page - 1)}>
          Sebelumnya
        </Link>
      )}
      {page * 30 < total && (
        <Link className={financeLink} href={href(page + 1)}>
          Berikutnya
        </Link>
      )}
    </nav>
  );
}
export async function AccountingHomePage() {
  if (
    !(await financeEntry([
      "finance_account",
      "journal",
      "finance_cost",
      "finance_period",
      "financial_report",
    ]))
  )
    return denied;
  return (
    <Workspace title="Akuntansi">
      <p className="max-w-prose text-sm text-muted-foreground">
        Keuangan IDR untuk dokumen LMS baru. Pemetaan akun cabang wajib
        dikonfigurasi sebelum invoice diterbitkan. Laporan mengikuti tanggal
        akuntansi; riwayat sebelum cakupan LMS tidak termasuk.
      </p>
    </Workspace>
  );
}

export async function AccountsPage({ query }: { query: Query }) {
  const actor = await financeEntry("finance_account");
  if (!actor) return denied;
  const parsed = listInput.safeParse(query);
  if (!parsed.success)
    return (
      <Workspace title="Akun & kategori">
        <p>Filter tidak valid.</p>
      </Workspace>
    );
  const catalog = await accountingQueries.accounts(),
    mappings = await accountingQueries.mappings(parsed.data);
  const manage = permits(actor, "manage", "finance_account");
  const accountCategories = catalog.categories
    .filter((c) => c.kind === "ACCOUNT" && c.active)
    .map((c) => ({ id: c.id, name: `${c.code} · ${c.name}` }));
  function accountFields(
    prefix: string,
    a?: (typeof catalog.accounts)[number],
  ) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <FinanceField
          prefix={prefix}
          name="code"
          label="Kode"
          value={a?.code}
        />
        <FinanceField
          prefix={prefix}
          name="name"
          label="Nama"
          value={a?.name}
        />
        <FinanceField
          prefix={prefix}
          name="kind"
          label="Klasifikasi"
          options={kinds}
          value={a?.kind}
        />
        <FinanceField
          prefix={prefix}
          name="categoryId"
          label="Kategori akun"
          options={accountCategories}
          value={a?.categoryId}
        />
        <FinanceField
          prefix={prefix}
          name="isCash"
          label="Akun kas / bank"
          options={bool}
          value={String(a?.isCash ?? false)}
        />
        <FinanceField
          prefix={prefix}
          name="active"
          label="Aktif"
          options={bool}
          value={String(a?.active ?? true)}
        />
      </div>
    );
  }
  return (
    <Workspace title="Akun & kategori">
      <p className="text-sm text-muted-foreground">
        ID akun dipakai pada formulir jurnal dan pemetaan. Klasifikasi/kode yang
        dipakai tetap terlindungi; nonaktifkan tanpa menghapus sejarah.
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            {[
              "ID",
              "Kode",
              "Nama",
              "Klasifikasi",
              "Saldo normal",
              "Status",
            ].map((h) => (
              <TableHead key={h}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {catalog.accounts.map((a) => (
            <TableRow key={a.id}>
              <TableCell>{a.id}</TableCell>
              <TableCell>{a.code}</TableCell>
              <TableCell>{a.name}</TableCell>
              <TableCell>
                {a.kind}
                {a.isCash ? " · Kas/bank" : ""}
              </TableCell>
              <TableCell>{a.normalBalance}</TableCell>
              <TableCell>{a.active ? "Aktif" : "Nonaktif"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {!catalog.accounts.length && (
        <p>Belum ada akun. Tambahkan kategori, lalu akun dan pemetaan.</p>
      )}
      {manage && (
        <section className="space-y-4 border-t pt-5">
          <h2 className="text-lg font-semibold">Tambah akun</h2>
          <CommandForm
            label="Simpan akun"
            values={{ action: "finance_account.manage", entity: "account" }}
          >
            {accountFields("account-new")}
          </CommandForm>
          {catalog.accounts.map((a) => (
            <details key={a.id} className="border-b py-3">
              <summary className="cursor-pointer py-2">
                Ubah {a.code} · {a.name}
              </summary>
              <CommandForm
                label="Simpan perubahan akun"
                values={{
                  action: "finance_account.manage",
                  entity: "account",
                  id: a.id,
                }}
              >
                {accountFields(`account-${a.id}`, a)}
              </CommandForm>
            </details>
          ))}
        </section>
      )}
      <section className="space-y-4 border-t pt-5">
        <h2 className="text-lg font-semibold">Kategori</h2>
        {catalog.categories.map((c) => (
          <div key={c.id}>
            <p>
              #{c.id} · {c.code} · {c.name} · {c.kind} {c.flowClass} ·{" "}
              {c.active ? "Aktif" : "Nonaktif"}
            </p>
            {manage && (
              <details>
                <summary className="cursor-pointer py-2">
                  Ubah kategori #{c.id}
                </summary>
                <CommandForm
                  label="Simpan kategori"
                  values={{
                    action: "finance_account.manage",
                    entity: "category",
                    id: c.id,
                    kind: c.kind,
                    ...(c.flowClass ? { flowClass: c.flowClass } : {}),
                  }}
                >
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <FinanceField
                      prefix={`cat-${c.id}`}
                      name="code"
                      label="Kode"
                      value={c.code}
                    />
                    <FinanceField
                      prefix={`cat-${c.id}`}
                      name="name"
                      label="Nama"
                      value={c.name}
                    />
                    <FinanceField
                      prefix={`cat-${c.id}`}
                      name="active"
                      label="Aktif"
                      options={bool}
                      value={String(c.active)}
                    />
                  </div>
                </CommandForm>
              </details>
            )}
          </div>
        ))}
        {manage && (
          <CommandForm
            label="Tambah kategori"
            values={{ action: "finance_account.manage", entity: "category" }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FinanceField prefix="cat-new" name="code" label="Kode" />
              <FinanceField prefix="cat-new" name="name" label="Nama" />
              <FinanceField
                prefix="cat-new"
                name="kind"
                label="Jenis kategori"
                options={categories}
              />
              <FinanceField
                prefix="cat-new"
                name="flowClass"
                label="Jenis arus (khusus arus kas)"
                options={flows}
                optional
              />
            </div>
          </CommandForm>
        )}
      </section>
      <section className="space-y-4 border-t pt-5">
        <h2 className="text-lg font-semibold">Versi pemetaan cabang</h2>
        <Filter query={query} />
        {mappings.map((m) => (
          <p key={m.id}>
            Versi #{m.id} · Cabang {m.branchId} · Piutang {m.receivableId} ·
            Pendapatan {m.revenueId} · Biaya langsung {m.costId} · Kewajiban{" "}
            {m.liabilityId}
          </p>
        ))}
        {!mappings.length && <p>Belum ada pemetaan cabang.</p>}
        {manage && (
          <CommandForm
            label="Simpan versi pemetaan"
            values={{ action: "finance_account.manage", entity: "mapping" }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FinanceBranchField prefix="map" />
              {[
                ["receivableId", "Piutang", "ASSET"],
                ["revenueId", "Pendapatan pengiriman", "REVENUE"],
                ["costId", "Biaya langsung", "EXPENSE"],
                ["liabilityId", "Kewajiban pemasok", "LIABILITY"],
              ].map(([name, label, kind]) => (
                <FinanceField
                  key={name}
                  prefix="map"
                  name={name}
                  label={label}
                  options={catalog.accounts
                    .filter((a) => a.kind === kind && !a.isCash && a.active)
                    .map((a) => ({ id: a.id, name: `${a.code} · ${a.name}` }))}
                />
              ))}
            </div>
          </CommandForm>
        )}
      </section>
    </Workspace>
  );
}

export async function JournalsPage({ query }: { query: Query }) {
  const actor = await financeEntry("journal");
  if (!actor) return denied;
  const parsed = listInput.safeParse(query);
  if (!parsed.success)
    return (
      <Workspace title="Jurnal">
        <p>Filter tidak valid.</p>
      </Workspace>
    );
  const result = await accountingQueries.journals(parsed.data);
  return (
    <Workspace title="Jurnal">
      <Filter query={query} />
      {permits(actor, "create", "journal") && (
        <details className="border-y py-3">
          <summary className="mb-4 cursor-pointer py-2">
            Buat jurnal manual
          </summary>
          <JournalForm {...(await journalFormChoices())} />
        </details>
      )}
      {permits(actor, "post", "journal") &&
        permits(actor, "create", "journal") && (
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <section className="min-w-0 space-y-4">
              <h2 className="text-lg font-semibold">Beban kas / bank</h2>
              <CommandForm
                label="Posting beban kas"
                values={{ action: "journal.expense" }}
              >
                <CommonFields prefix="expense" />
                {[
                  ["expenseAccountId", "ID akun beban"],
                  ["cashAccountId", "ID akun kas / bank"],
                  ["cashflowCategoryId", "ID kategori arus kas"],
                ].map(([name, label]) => (
                  <FinanceField
                    key={name}
                    prefix="expense"
                    name={name}
                    label={label}
                    type="number"
                  />
                ))}
                <FinanceField
                  prefix="expense"
                  name="amount"
                  label="Jumlah IDR"
                />
              </CommandForm>
            </section>
            <section className="min-w-0 space-y-4">
              <h2 className="text-lg font-semibold">Transfer kas internal</h2>
              <CommandForm
                label="Posting transfer internal"
                values={{ action: "journal.transfer" }}
              >
                <CommonFields prefix="transfer" />
                <FinanceField
                  prefix="transfer"
                  name="fromAccountId"
                  label="ID akun kas / bank asal"
                  type="number"
                />
                <FinanceField
                  prefix="transfer"
                  name="toAccountId"
                  label="ID akun kas / bank tujuan"
                  type="number"
                />
                <FinanceField
                  prefix="transfer"
                  name="amount"
                  label="Jumlah IDR"
                />
              </CommandForm>
            </section>
          </div>
        )}
      {!result.items.length && <p>Belum ada jurnal untuk filter ini.</p>}
      {result.items.map((j) => (
        <section
          key={j.id}
          id={`journal-${j.id}`}
          className="space-y-4 border-t pt-5"
        >
          <h2 className="text-lg font-semibold">
            Jurnal #{j.id} · {j.status}
          </h2>
          <p className="break-words text-sm">
            Cabang {j.branchId} · {j.accountingDate} · {j.reference} ·{" "}
            {j.sourceType} {j.sourceId ? `#${j.sourceId}` : ""}
            {j.reversalOfId ? ` · Pembalikan jurnal #${j.reversalOfId}` : ""} ·
            Pemetaan #{j.mappingId ?? "—"}
          </p>
          <p className="break-words text-sm">{j.reason}</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID akun</TableHead>
                <TableHead className="text-right">Debit IDR</TableHead>
                <TableHead className="text-right">Kredit IDR</TableHead>
                <TableHead>Transaksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {j.lines.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{l.accountId}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatRupiah(l.debit, { prefix: false })}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatRupiah(l.credit, { prefix: false })}
                  </TableCell>
                  <TableCell>{l.transactionId ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {j.status === "DRAFT" && permits(actor, "post", "journal") && (
            <CommandForm
              label={`Posting jurnal #${j.id}`}
              values={{ action: "journal.post", id: j.id }}
            />
          )}
          {j.status === "POSTED" &&
            !j.reversal &&
            !j.reversalOfId &&
            ["MANUAL", "CASH_EXPENSE", "TRANSFER"].includes(j.sourceType) &&
            permits(actor, "reverse", "journal") && (
              <CommandForm
                label={`Balikkan jurnal #${j.id}`}
                values={{ action: "journal.reverse", id: j.id }}
              >
                <FinanceField
                  prefix={`jr-${j.id}`}
                  name="accountingDate"
                  label="Tanggal pembalikan (periode terbuka)"
                  type="date"
                />
                <FinanceField
                  prefix={`jr-${j.id}`}
                  name="reason"
                  label="Alasan pembalikan"
                />
              </CommandForm>
            )}
        </section>
      ))}
      <Pages page={result.page} total={result.total} query={query} />
    </Workspace>
  );
}
function CommonFields({
  prefix,
  reference = true,
}: {
  prefix: string;
  reference?: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FinanceBranchField prefix={prefix} />
      <FinanceField
        prefix={prefix}
        name="accountingDate"
        label="Tanggal akuntansi"
        type="date"
      />
      {reference && (
        <FinanceField
          prefix={prefix}
          name="reference"
          label="Referensi dokumen"
        />
      )}
      <FinanceField prefix={prefix} name="reason" label="Keterangan / bukti" />
    </div>
  );
}

export async function CostsPage({ query }: { query: Query }) {
  const actor = await financeEntry("finance_cost");
  if (!actor) return denied;
  const parsed = costListInput.safeParse(query);
  if (!parsed.success)
    return (
      <Workspace title="Biaya aktual">
        <p>Filter tidak valid.</p>
      </Workspace>
    );
  const result = await accountingQueries.costs(parsed.data);
  return (
    <Workspace title="Biaya aktual">
      <p className="max-w-prose text-sm text-muted-foreground">
        Catat biaya sebenarnya dari dokumen pemasok, lalu konfirmasi
        kelengkapannya. Biaya yang belum diketahui tidak dianggap nol.
        Pembatalan invoice tidak membatalkan kewajiban pemasok.
      </p>
      <Filter query={query} />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        {permits(actor, "create", "finance_cost") && (
          <section className="min-w-0 space-y-4">
            <h2 className="text-lg font-semibold">Catat biaya</h2>
            <CommandForm
              label="Posting biaya aktual"
              values={{ action: "finance_cost.create" }}
            >
              <CommonFields prefix="cost-new" reference={false} />
              <FinanceField
                prefix="cost-new"
                name="transactionId"
                label="ID transaksi / AWB"
                type="number"
              />
              <FinanceField
                prefix="cost-new"
                name="amount"
                label="Jumlah IDR"
              />
              <FinanceField
                prefix="cost-new"
                name="supplierReference"
                label="Referensi pemasok / dokumen"
              />
            </CommandForm>
          </section>
        )}
        {permits(actor, "finalize", "finance_cost") && (
          <section className="min-w-0 space-y-4">
            <h2 className="text-lg font-semibold">
              Konfirmasi kelengkapan biaya
            </h2>
            <p className="text-sm">
              Untuk biaya nol, keterangan wajib menjelaskan bukti biaya nol
              secara eksplisit.
            </p>
            <CommandForm
              label="Konfirmasi biaya lengkap"
              values={{ action: "finance_cost.finalize" }}
            >
              <CommonFields prefix="cost-final" reference={false} />
              <FinanceField
                prefix="cost-final"
                name="transactionId"
                label="ID transaksi / AWB"
                type="number"
              />
            </CommandForm>
          </section>
        )}
      </div>
      <section className="space-y-3 border-t pt-5">
        <h2 className="text-lg font-semibold">Kelengkapan sumber</h2>
        {!result.items.length && <p>Belum ada deklarasi biaya.</p>}
        {result.items.map((s) => (
          <p key={s.transactionId}>
            Transaksi #{s.transactionId} · Cabang {s.branchId} ·{" "}
            {s.finalized ? "Lengkap" : "Belum lengkap"} · {s.evidence}
          </p>
        ))}
        <Pages page={result.page} total={result.total} query={query} />
      </section>
      <section className="space-y-4 border-t pt-5">
        <h2 className="text-lg font-semibold">Peristiwa biaya</h2>
        {result.events.map((c) => (
          <div key={c.id} className="space-y-3 border-b pb-4">
            <p className="break-words">
              Biaya #{c.id} · Transaksi {c.transactionId} · {c.accountingDate} ·{" "}
              {formatRupiah(c.amount)} · {c.supplierReference}
              {c.reversalOfId ? ` · Pembalikan #${c.reversalOfId}` : ""}
            </p>
            <p className="text-sm">{c.reason}</p>
            {!c.reversal &&
              !c.reversalOfId &&
              permits(actor, "reverse", "finance_cost") && (
                <CommandForm
                  label={`Balikkan biaya #${c.id}`}
                  values={{ action: "finance_cost.reverse", id: c.id }}
                >
                  <FinanceField
                    prefix={`cr-${c.id}`}
                    name="accountingDate"
                    label="Tanggal pembalikan"
                    type="date"
                  />
                  <FinanceField
                    prefix={`cr-${c.id}`}
                    name="reason"
                    label="Alasan / bukti pembatalan kewajiban"
                  />
                </CommandForm>
              )}
          </div>
        ))}
      </section>
      <Pages
        page={result.eventPage}
        total={result.eventTotal}
        query={query}
        param="eventPage"
      />
    </Workspace>
  );
}
export async function PeriodsPage({ query }: { query: Query }) {
  const actor = await financeEntry("finance_period");
  if (!actor) return denied;
  const parsed = listInput.safeParse(query);
  if (!parsed.success)
    return (
      <Workspace title="Periode">
        <p>Filter tidak valid.</p>
      </Workspace>
    );
  const rows = await accountingQueries.periods(parsed.data);
  return (
    <Workspace title="Periode akuntansi">
      <p className="text-sm">
        Penutupan mengunci bulan tersebut dan tanggal sebelumnya untuk cabang.
        Koreksi sesudahnya memakai pembalikan pada periode terbuka. Tidak ada
        buka ulang.
      </p>
      <Filter query={query} />
      {rows.map((r) => (
        <p key={r.id}>
          Cabang {r.branchId} · ditutup sampai {r.month} · {r.createdAt}
        </p>
      ))}
      {!rows.length && <p>Belum ada periode ditutup.</p>}
      {permits(actor, "close", "finance_period") && (
        <CommandForm
          label="Tutup periode cabang"
          values={{ action: "finance_period.close" }}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FinanceBranchField prefix="close" />
            <FinanceField
              prefix="close"
              name="month"
              label="Bulan"
              type="month"
            />
            <FinanceField
              prefix="close"
              name="reason"
              label="Bukti rekonsiliasi / alasan"
            />
          </div>
        </CommandForm>
      )}
    </Workspace>
  );
}

export async function FinancialReportsPage({ query }: { query: Query }) {
  if (!(await financeEntry("financial_report"))) return denied;
  const parsed = reportInput.safeParse(query);
  if (!parsed.success)
    return (
      <Workspace title="Laporan keuangan">
        <Filter query={query} dates />
        <p>
          Pilih cabang dan periode maksimal 366 hari. Laporan hanya mencakup
          dokumen LMS baru dengan tanggal akuntansi pada periode ini.
        </p>
      </Workspace>
    );
  const r = await accountingQueries.report(parsed.data);
  return (
    <Workspace title="P&L, Gross Profit & arus kas">
      <Filter query={query} dates />
      <p>
        Cabang {r.branchId} · {r.start} sampai {r.end} · IDR ·{" "}
        {r.complete
          ? "Biaya lengkap berdasarkan deklarasi saat ini"
          : "BELUM LENGKAP — angka laba belum final"}
      </p>
      {!r.complete && (
        <p className="rounded-md border border-destructive p-3 text-sm break-words text-destructive">
          Biaya belum lengkap untuk transaksi: {r.incomplete.join(", ")}
          {r.incompleteOverflow ? " dan lainnya" : ""}. Lengkapi bukti biaya
          sebelum finalisasi.
        </p>
      )}
      <section className="space-y-3 border-t pt-5">
        <h2 className="text-lg font-semibold">Profit & Loss</h2>
        <dl className="grid gap-4 rounded-lg border bg-background p-4 sm:grid-cols-3 [&_dt]:text-sm [&_dt]:text-muted-foreground [&_dd]:mt-1 [&_dd]:font-semibold">
          <div>
            <dt>Pendapatan bersih</dt>
            <dd className="tabular-nums">{formatRupiah(r.revenue)}</dd>
          </div>
          <div>
            <dt>Beban bersih</dt>
            <dd className="tabular-nums">{r.expenses}</dd>
          </div>
          <div>
            <dt>Laba / rugi {r.complete ? "" : "(belum final)"}</dt>
            <dd className="tabular-nums">{r.netProfit}</dd>
          </div>
        </dl>
        <p className="text-sm">
          Gross Profit {r.grossProfit ?? "BELUM LENGKAP"} + pendapatan lain{" "}
          {r.bridge.otherRevenue} − beban lain {r.bridge.otherExpense} = laba /
          rugi {r.netProfit}.
        </p>
      </section>
      <section className="space-y-3 border-t pt-5">
        <h2 className="text-lg font-semibold">Gross Profit per transaksi</h2>
        <p className="text-sm text-muted-foreground">
          Pergerakan tanggal akuntansi, termasuk biaya belum ditagihkan.
          Pembalikan periode berikutnya tidak mengubah angka periode tertutup.
        </p>
        <MarginTable rows={r.gp} />
        <h2 className="text-lg font-semibold">Rekap Gross Profit bulanan</h2>
        <MarginTable rows={r.recap} />
      </section>
      <section className="space-y-3 border-t pt-5">
        <h2 className="text-lg font-semibold">Arus kas</h2>
        {r.cashflow.length ? (
          r.cashflow.map((c) => (
            <p key={c.category}>
              {c.category} ·{" "}
              <span className="text-right tabular-nums">
                {formatRupiah(c.amount)}
              </span>
            </p>
          ))
        ) : (
          <p>Tidak ada pergerakan arus kas eksternal.</p>
        )}
      </section>
      <section className="space-y-3 border-t pt-5">
        <h2 className="text-lg font-semibold">
          Buku besar — pergerakan periode
        </h2>
        <p className="text-sm">
          Saldo awal historis tidak termasuk. Untuk saldo berjalan, pilih
          rentang sejak awal cakupan LMS.
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Akun</TableHead>
              <TableHead className="text-right">Debit IDR</TableHead>
              <TableHead className="text-right">Kredit IDR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {r.ledger.map((l) => (
              <TableRow key={l.accountId}>
                <TableCell>
                  {l.code} · {l.name}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatRupiah(l.debit, { prefix: false })}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatRupiah(l.credit, { prefix: false })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
      <details className="border-t pt-5">
        <summary className="cursor-pointer py-2">
          Telusuri {r.lines.length} baris jurnal sumber
        </summary>
        <Table>
          <TableHeader>
            <TableRow>
              {[
                "Tanggal",
                "Jurnal",
                "Sumber",
                "Referensi",
                "Transaksi",
                "Akun",
                "Debit",
                "Kredit",
              ].map((h) => (
                <TableHead
                  key={h}
                  className={
                    h === "Debit" || h === "Kredit" ? "text-right" : undefined
                  }
                >
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {r.lines.map((l) => (
              <TableRow key={l.id}>
                <TableCell>{l.accountingDate}</TableCell>
                <TableCell>#{l.journalId}</TableCell>
                <TableCell>
                  {l.sourceType} #{l.sourceId ?? "—"}
                </TableCell>
                <TableCell className="break-words">{l.reference}</TableCell>
                <TableCell>{l.transactionId ?? "—"}</TableCell>
                <TableCell>{l.accountId}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatRupiah(l.debit, { prefix: false })}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatRupiah(l.credit, { prefix: false })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </details>
    </Workspace>
  );
}
function MarginTable({
  rows,
}: {
  rows: {
    key: number | string;
    revenue: string;
    cost: string;
    profit: string | null;
  }[];
}) {
  return rows.length ? (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Sumber / bulan</TableHead>
          <TableHead className="text-right">Pendapatan IDR</TableHead>
          <TableHead className="text-right">Biaya IDR</TableHead>
          <TableHead className="text-right">Gross Profit IDR</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.key}>
            <TableCell>{r.key}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatRupiah(r.revenue, { prefix: false })}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatRupiah(r.cost, { prefix: false })}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {r.profit ?? "BELUM LENGKAP"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ) : (
    <p>Belum ada pergerakan bersumber untuk periode ini.</p>
  );
}
