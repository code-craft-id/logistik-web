import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ConfirmSubmit } from "@/components/patterns/confirm-dialog";
import { EmptyState } from "@/components/patterns/content-state";
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
import { permits, permitsBranch } from "@/features/identity/permissions";
import { currentIdentity } from "@/features/identity/server/context";
import {
  createVendorProcessAction,
  deleteVendorProcessAction,
} from "@/features/modul/actions";
import { ActionForm } from "@/features/modul/components/action-form";
import {
  ListFilter,
  ModulHeader,
  one,
  selectClass,
} from "@/features/modul/components/page-bits";
import {
  listVendorProcesses,
  vendorChoices,
} from "@/features/modul/server/vendor-processes";
import { businessDateString } from "@/lib/date/business-date";

export const metadata: Metadata = { title: "Proses Vendor" };

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
  if (!permits(actor, "view", "vendor_process"))
    return (
      <EmptyState
        title="Akses ditolak"
        description="Grup Anda belum memiliki hak lihat Proses Vendor. Minta admin menambahkan hak tersebut di Hak Akses Menu."
      />
    );
  const query = await searchParams;
  const canCreate = permits(actor, "create", "vendor_process");
  const canDelete = permits(actor, "delete", "vendor_process");
  const [list, vendors] = await Promise.all([
    listVendorProcesses(actor, {
      search: one(query.search),
      from: one(query.from),
      to: one(query.to),
      page: one(query.page),
    }),
    canCreate ? vendorChoices() : Promise.resolve([]),
  ]);
  const pages = Math.max(1, Math.ceil(list.total / list.pageSize));
  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    if (list.filters.search) params.set("search", list.filters.search);
    params.set("from", list.filters.from);
    params.set("to", list.filters.to);
    params.set("page", String(page));
    return `/vendor-processes?${params}`;
  };
  return (
    <div className="min-w-0 space-y-5">
      <ModulHeader
        title="Proses Vendor"
        info="Catat AWB yang diteruskan ke vendor (pihak ketiga) beserta nomor AWB dari vendor tersebut. Satu AWB hanya bisa punya satu proses vendor aktif; hapus dulu bila salah vendor."
      />
      {canCreate && (
        <section
          aria-label="Tambah proses vendor"
          className="rounded-lg border bg-background p-4"
        >
          {vendors.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada vendor aktif. Tambahkan vendor di Master Data &gt;
              Vendor.
            </p>
          ) : (
            <ActionForm action={createVendorProcessAction} reset>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="vp-date">Tanggal *</Label>
                  <Input
                    id="vp-date"
                    name="processDate"
                    type="date"
                    required
                    defaultValue={businessDateString()}
                    className="min-h-11"
                  />
                </div>
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="vp-awb">AWB *</Label>
                  <Input
                    id="vp-awb"
                    name="awbNo"
                    required
                    maxLength={50}
                    autoComplete="off"
                    placeholder="Nomor AWB"
                    className="min-h-11"
                  />
                </div>
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="vp-vendor">Vendor *</Label>
                  <select
                    id="vp-vendor"
                    name="vendorId"
                    required
                    defaultValue=""
                    className={selectClass}
                  >
                    <option value="">Pilih vendor…</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="vp-vendor-awb">AWB Vendor</Label>
                  <Input
                    id="vp-vendor-awb"
                    name="vendorAwbNo"
                    maxLength={100}
                    autoComplete="off"
                    className="min-h-11"
                  />
                </div>
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="vp-remarks">Keterangan</Label>
                  <Input
                    id="vp-remarks"
                    name="remarks"
                    maxLength={500}
                    className="min-h-11"
                  />
                </div>
              </div>
            </ActionForm>
          )}
        </section>
      )}
      <ListFilter
        action="/vendor-processes"
        values={{
          search: list.filters.search,
          from: list.filters.from,
          to: list.filters.to,
        }}
        searchLabel="AWB atau AWB Vendor"
      />
      {list.rows.length === 0 ? (
        <EmptyState
          title="Belum ada data"
          description={`Tidak ada proses vendor pada ${list.filters.from} sampai ${list.filters.to}.`}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>AWB</TableHead>
                <TableHead>AWB Vendor</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Tujuan / Penerima</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead>Cabang</TableHead>
                <TableHead>Dicatat oleh</TableHead>
                {canDelete && <TableHead>Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap">
                    {row.date}
                  </TableCell>
                  <TableCell className="font-medium whitespace-nowrap">
                    <Link
                      href={`/transactions/${row.transactionId}`}
                      className="text-primary underline underline-offset-4"
                    >
                      {row.transaction.awbNo ?? "-"}
                    </Link>
                  </TableCell>
                  <TableCell>{row.vendorAwbNo ?? "-"}</TableCell>
                  <TableCell>{row.vendor.name}</TableCell>
                  <TableCell>
                    {[
                      row.transaction.destinationBranch?.name,
                      row.transaction.receiverName,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "-"}
                  </TableCell>
                  <TableCell>{row.remarks ?? "-"}</TableCell>
                  <TableCell>{row.branch.name}</TableCell>
                  <TableCell>{row.createdBy?.name ?? "-"}</TableCell>
                  {canDelete && (
                    <TableCell>
                      {permitsBranch(actor, row.branchId) && (
                        <ActionForm
                          action={deleteVendorProcessAction}
                          submit={
                            <ConfirmSubmit
                              variant="outline"
                              size="sm"
                              className="min-h-11"
                              title={`Hapus proses vendor AWB ${row.transaction.awbNo ?? ""}?`}
                              description="AWB bisa dicatat ulang ke vendor yang benar."
                            >
                              Hapus
                            </ConfirmSubmit>
                          }
                        >
                          <input type="hidden" name="id" value={row.id} />
                        </ActionForm>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {pages > 1 && (
        <nav
          aria-label="Halaman"
          className="flex items-center justify-between gap-3 text-sm"
        >
          <span>
            Halaman {list.filters.page} dari {pages} · {list.total} data
          </span>
          <div className="flex gap-3">
            {list.filters.page > 1 && (
              <Link
                href={pageHref(list.filters.page - 1)}
                className="inline-flex min-h-11 items-center underline"
              >
                Sebelumnya
              </Link>
            )}
            {list.filters.page < pages && (
              <Link
                href={pageHref(list.filters.page + 1)}
                className="inline-flex min-h-11 items-center underline"
              >
                Berikutnya
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
