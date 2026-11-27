import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/patterns/content-state";
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
import { ExcelImport } from "@/features/imports/excel-import";
import { lastConsigneeId } from "@/features/imports/server/consignees";
import { CustomerImport } from "@/features/sales/components/customer-import";
import {
  DeletePartyButton,
  type PartyField,
  PartyForm,
} from "@/features/sales/components/party-forms";
import { lastCustomerId } from "@/features/sales/server/customer-import";
import {
  listParties,
  type PartyKind,
  partyOptions,
} from "@/features/sales/server/parties";

export const metadata: Metadata = { title: "Pemasaran/Penjualan" };

// Session-dependent page; blocking render.
export const instant = false;

const link =
  "inline-flex min-h-11 items-center text-primary underline underline-offset-4";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const actor = current.actor;
  const query = await searchParams;
  const one = (v: string | string[] | undefined) =>
    typeof v === "string" ? v : undefined;
  const tabs = (["customer", "consignee"] as const).filter((k) =>
    permits(actor, "view", k),
  );
  if (!tabs.length)
    return (
      <EmptyState
        title="Akses ditolak"
        description="Anda belum memiliki hak lihat Customer atau Penerima."
      />
    );
  const kind: PartyKind =
    one(query.tab) === "consignee" && tabs.includes("consignee")
      ? "consignee"
      : tabs[0];
  const search = one(query.search) ?? "";
  const page = Number(one(query.page) ?? 1) || 1;
  const editId = Number(one(query.edit));
  const canWrite =
    permits(actor, "create", kind) || permits(actor, "update", kind);
  const empty = {
    branches: [],
    marketing: [],
    terms: [],
    costTypes: [],
    customers: [],
  };
  const lastId = kind === "customer" ? await lastCustomerId(actor) : 0;
  const lastConsignee = kind === "consignee" ? await lastConsigneeId(actor) : 0;
  const [result, options] = await Promise.all([
    listParties(actor, kind, { search, page }),
    canWrite ? partyOptions(actor, kind) : Promise.resolve(empty),
  ]);
  const base = (extra: Record<string, string>) =>
    `/marketing?${new URLSearchParams({ tab: kind, ...(search ? { search } : {}), ...extra })}`;
  const branchField: PartyField = {
    key: "branchId",
    label: "Cabang",
    type: "choice",
    options: options.branches,
    emptyLabel: "Semua cabang (khusus admin)",
  };
  const fields: PartyField[] =
    kind === "customer"
      ? [
          {
            key: "name",
            label: "Nama",
            type: "text",
            required: true,
            max: 150,
          },
          { key: "address", label: "Alamat", type: "text", max: 500 },
          { key: "phone", label: "No. Telp", type: "text", max: 30 },
          { key: "contactPerson", label: "Kontak", type: "text", max: 100 },
          { key: "email", label: "Email", type: "email", max: 150 },
          branchField,
          {
            key: "marketingPersonId",
            label: "Marketing",
            type: "choice",
            options: options.marketing,
            emptyLabel: "Tidak dipilih",
          },
          {
            key: "costTypeId",
            label: "Pembayaran",
            type: "choice",
            options: options.costTypes,
            emptyLabel: "Tidak dipilih",
          },
          {
            key: "termId",
            label: "Termin",
            type: "choice",
            options: options.terms,
            emptyLabel: "Tidak dipilih",
          },
          {
            key: "whatsAppNotificationEnabled",
            label: "WA Notif",
            type: "toggle",
          },
        ]
      : [
          {
            key: "name",
            label: "Nama",
            type: "text",
            required: true,
            max: 150,
          },
          { key: "address1", label: "Alamat", type: "text", max: 500 },
          { key: "phone", label: "No. Telp", type: "text", max: 30 },
          { key: "pic", label: "PIC", type: "text", max: 100 },
          {
            key: "customerId",
            label: "Customer",
            type: "choice",
            options: options.customers,
            emptyLabel: "Tidak dipilih",
          },
          branchField,
        ];
  const headers =
    kind === "customer"
      ? [
          "Nama",
          "Alamat",
          "No. Telp",
          "Kontak",
          "Cabang",
          "Marketing",
          "Pembayaran",
          "Termin",
          "WA Notif",
        ]
      : ["Nama", "Alamat", "No. Telp", "PIC", "Customer", "Cabang"];
  const editing = result.items.find((item) => item.id === editId);
  const canCreate = permits(actor, "create", kind);
  const canUpdate = permits(actor, "update", kind);
  const canDelete = permits(actor, "delete", kind);
  const label = kind === "customer" ? "Customer" : "Penerima";
  return (
    <div className="min-w-0 space-y-5 [overflow-wrap:anywhere]">
      <header className="space-y-1">
        <div className="flex items-center gap-1">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Pemasaran/Penjualan
          </h1>
          <InfoTip
            text={
              "Data Customer dan Penerima dalam cakupan cabang Anda. Data yang dihapus tetap tercatat pada AWB lama."
            }
          />
        </div>
      </header>
      <nav aria-label="Jenis data" className="flex gap-4 border-b">
        {tabs.map((tab) => (
          <Link
            key={tab}
            href={`/marketing?tab=${tab}`}
            aria-current={tab === kind ? "page" : undefined}
            className="inline-flex min-h-11 items-center border-b-2 border-transparent px-1 text-sm aria-[current=page]:border-primary aria-[current=page]:font-semibold"
          >
            {tab === "customer" ? "Customer" : "Penerima"}
          </Link>
        ))}
        {permits(actor, "view", "customer") && (
          <Link
            href="/marketing/tarif"
            className="inline-flex min-h-11 items-center border-b-2 border-transparent px-1 text-sm"
          >
            Tarif Customer
          </Link>
        )}
        {permits(actor, "view", "customer") && (
          <Link
            href="/marketing/revenue"
            className="inline-flex min-h-11 items-center border-b-2 border-transparent px-1 text-sm"
          >
            Pendapatan Pelanggan
          </Link>
        )}
      </nav>
      {kind === "customer" && (
        <CustomerImport
          canImport={permits(actor, "create", "customer")}
          lastId={lastId}
        />
      )}
      {kind === "consignee" && permits(actor, "create", "consignee") && (
        <div className="space-y-3 rounded-lg border bg-background p-4">
          <p className="text-sm">
            Unique terakhir: <strong>{lastConsignee}</strong>
          </p>
          <ExcelImport target="consignee" />
        </div>
      )}
      {(editing ? canUpdate : canCreate) && (
        <details
          open={!!editing}
          className="rounded-lg border bg-background p-4 sm:p-6"
        >
          <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold">
            {editing ? `Ubah ${editing.name}` : `+ Tambah ${label}`}
          </summary>
          <div className="mt-4">
            <PartyForm
              key={editing?.id ?? "new"}
              kind={kind}
              fields={fields}
              values={editing?.values}
              id={editing?.id}
              doneHref={base({ page: String(result.page) })}
            />
          </div>
        </details>
      )}
      <Form
        action="/marketing"
        className="flex flex-col gap-2 rounded-lg border bg-background p-4 sm:flex-row sm:items-end"
      >
        <input type="hidden" name="tab" value={kind} />
        <div className="min-w-0 flex-1 space-y-2">
          <label htmlFor="party-search" className="text-sm font-medium">
            Cari nama {label.toLowerCase()}
          </label>
          <Input
            id="party-search"
            name="search"
            maxLength={100}
            defaultValue={search}
            className="min-h-11"
          />
        </div>
        <Button type="submit" variant="outline" className="min-h-11">
          Cari
        </Button>
      </Form>
      <section
        aria-label={`Daftar ${label}`}
        className="min-w-0 rounded-lg border bg-background"
      >
        {result.items.length ? (
          <div className="overflow-x-auto">
            <Table className="min-w-[56rem]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No.</TableHead>
                  {headers.map((h) => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="tabular-nums">
                      {(result.page - 1) * 25 + index + 1}
                    </TableCell>
                    {item.columns.map((value, index) => (
                      <TableCell key={headers[index]}>{value ?? "—"}</TableCell>
                    ))}
                    <TableCell className="whitespace-nowrap">
                      {canUpdate && (
                        <Link
                          className={link}
                          href={base({
                            page: String(result.page),
                            edit: String(item.id),
                          })}
                        >
                          Ubah
                        </Link>
                      )}
                      {kind === "customer" && (
                        <Link
                          className={`${link} mr-3`}
                          href={`/marketing/tarif?customerId=${item.id}`}
                        >
                          Tarif
                        </Link>
                      )}
                      {canDelete && (
                        <DeletePartyButton
                          kind={kind}
                          id={item.id}
                          name={item.name}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            title={search ? "Tidak ada yang cocok" : `Belum ada ${label}`}
            description={
              search
                ? "Ubah kata pencarian atau kosongkan untuk melihat semua."
                : `${label} yang ditambahkan akan tampil di sini.`
            }
          />
        )}
      </section>
      <nav
        aria-label="Halaman"
        className="flex flex-wrap items-center gap-4 text-sm"
      >
        <span>
          {result.total} data · halaman {result.page} dari {result.pages}
        </span>
        {result.page > 1 && (
          <Link className={link} href={base({ page: String(result.page - 1) })}>
            Sebelumnya
          </Link>
        )}
        {result.page < result.pages && (
          <Link className={link} href={base({ page: String(result.page + 1) })}>
            Berikutnya
          </Link>
        )}
      </nav>
    </div>
  );
}
