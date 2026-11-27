import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/patterns/content-state";
import { PageTabs } from "@/components/patterns/page-tabs";
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
import { ActionForm } from "@/features/modul/components/action-form";
import {
  ListFilter,
  ModulHeader,
  one,
  selectClass,
} from "@/features/modul/components/page-bits";
import { createDeliverySheetAction } from "@/features/shipments/delivery-sheet-actions";
import {
  deliverySheetFormOptions,
  listStandaloneDeliverySheets,
} from "@/features/shipments/server/delivery-sheets";
import { businessDateString } from "@/lib/date/business-date";

export const metadata: Metadata = { title: "Kurir Kota (DRS)" };

// Session- and query-dependent page; blocking render.
export const instant = false;

const deliverySheetTabs = [
  { key: "list", label: "Kurir Kota", href: "/delivery-sheets" },
  { key: "print", label: "Print DRS", href: "/delivery-sheets?tab=print" },
];

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const actor = current.actor;
  if (!permits(actor, "view", "delivery"))
    return (
      <EmptyState
        title="Akses ditolak"
        description="Grup Anda belum memiliki hak lihat Delivery Sheet. Minta admin menambahkan hak tersebut."
      />
    );
  const query = await searchParams;
  const printTab = one(query.tab) === "print";
  const canCreate = !printTab && permits(actor, "create", "delivery");
  const [list, options] = await Promise.all([
    listStandaloneDeliverySheets(actor, {
      search: one(query.search),
      from: one(query.from),
      to: one(query.to),
      page: one(query.page),
    }),
    canCreate ? deliverySheetFormOptions(actor) : null,
  ]);
  const ownBranches =
    options?.branches.filter((b) => permitsBranch(actor, b.id)) ?? [];
  const pages = Math.max(1, Math.ceil(list.total / list.pageSize));
  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    if (printTab) params.set("tab", "print");
    if (list.filters.search) params.set("search", list.filters.search);
    params.set("from", list.filters.from);
    params.set("to", list.filters.to);
    params.set("page", String(page));
    return `/delivery-sheets?${params}`;
  };
  return (
    <div className="min-w-0 space-y-5">
      <PageTabs
        label="Lembar Pengantaran"
        tabs={deliverySheetTabs}
        active={printTab ? "print" : "list"}
      />
      <ModulHeader
        title={printTab ? "Print DRS" : "Tambah DRS (Kurir Kota)"}
        info="Lembar pengantaran (DRS) untuk kurir kota, tanpa manifest. Buat DRS, tambahkan AWB yang akan diantar, cetak, lalu catat hasil antar (Terkirim, Gagal, Retur). DRS dari manifest tetap dibuat di detail manifest."
      />
      {canCreate && options && (
        <section
          aria-label="Tambah DRS"
          className="rounded-lg border bg-background p-4"
        >
          {ownBranches.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Akun Anda belum punya cabang, jadi belum bisa membuat DRS.
            </p>
          ) : (
            <ActionForm
              action={createDeliverySheetAction}
              className="grid gap-3"
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="drs-no">DRS No.</Label>
                  <Input
                    id="drs-no"
                    name="sheetNo"
                    maxLength={50}
                    placeholder="Kosongkan untuk nomor otomatis"
                    className="min-h-11"
                  />
                </div>
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="drs-date">Tanggal *</Label>
                  <Input
                    id="drs-date"
                    name="deliveryDate"
                    type="date"
                    required
                    defaultValue={businessDateString()}
                    className="min-h-11"
                  />
                </div>
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="drs-branch">Cabang *</Label>
                  <select
                    id="drs-branch"
                    name="branchId"
                    required
                    defaultValue={
                      ownBranches.length === 1 ? ownBranches[0].id : ""
                    }
                    className={selectClass}
                  >
                    <option value="">Pilih cabang…</option>
                    {ownBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="drs-courier">Kurir *</Label>
                  <select
                    id="drs-courier"
                    name="courierId"
                    required
                    defaultValue=""
                    className={selectClass}
                  >
                    <option value="">Pilih kurir…</option>
                    {options.couriers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="drs-driver">Driver</Label>
                  <select
                    id="drs-driver"
                    name="driverId"
                    defaultValue=""
                    className={selectClass}
                  >
                    <option value="">Tanpa driver</option>
                    {options.drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="drs-vehicle">Nopol</Label>
                  <select
                    id="drs-vehicle"
                    name="vehicleId"
                    defaultValue=""
                    className={selectClass}
                  >
                    <option value="">Tanpa kendaraan</option>
                    {options.vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.licensePlate} · {v.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="drs-agent">Agen</Label>
                  <select
                    id="drs-agent"
                    name="agentId"
                    defaultValue=""
                    className={selectClass}
                  >
                    <option value="">Tanpa agen (antar ke tujuan)</option>
                    {options.agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="drs-remarks">Keterangan</Label>
                  <Input
                    id="drs-remarks"
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
        action="/delivery-sheets"
        values={{
          search: list.filters.search,
          from: list.filters.from,
          to: list.filters.to,
        }}
        searchLabel="DRS No. atau AWB"
        hidden={printTab ? { tab: "print" } : undefined}
      />
      {list.rows.length === 0 ? (
        <EmptyState
          title="Belum ada DRS"
          description={`Tidak ada DRS kurir kota pada ${list.filters.from} sampai ${list.filters.to}.`}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>DRS No.</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Cabang</TableHead>
                <TableHead>Agen</TableHead>
                <TableHead>Kurir</TableHead>
                <TableHead>Driver / Nopol</TableHead>
                <TableHead className="text-right">Tot. AWB</TableHead>
                <TableHead className="text-right">Tot. Koli</TableHead>
                <TableHead className="text-right">Tot. Kg</TableHead>
                <TableHead className="text-right">Tot. Volume</TableHead>
                <TableHead>Selesai</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    <Link
                      href={`/delivery-sheets/${row.id}`}
                      className="text-primary underline underline-offset-4"
                    >
                      {row.sheetNo}
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {row.date}
                  </TableCell>
                  <TableCell>{row.branch ?? "-"}</TableCell>
                  <TableCell>{row.agent ?? "-"}</TableCell>
                  <TableCell>{row.courier ?? "-"}</TableCell>
                  <TableCell>
                    {[row.driver, row.vehicle].filter(Boolean).join(" / ") ||
                      "-"}
                  </TableCell>
                  <TableCell className="text-right">{row.awb}</TableCell>
                  <TableCell className="text-right">{row.koli}</TableCell>
                  <TableCell className="text-right">{row.kilo}</TableCell>
                  <TableCell className="text-right">{row.volume}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {row.done}/{row.awb}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex gap-3">
                      <Link
                        href={`/delivery-sheets/${row.id}`}
                        className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
                      >
                        Detail
                      </Link>
                      <a
                        href={`/print/delivery-sheets/${row.id}`}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
                      >
                        Print DRS
                      </a>
                    </div>
                  </TableCell>
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
            Halaman {list.filters.page} dari {pages} · {list.total} DRS
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
