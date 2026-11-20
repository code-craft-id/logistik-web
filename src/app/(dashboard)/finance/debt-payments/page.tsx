import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/patterns/content-state";
import { Button } from "@/components/ui/button";
import { ComboSelect } from "@/components/ui/combo-select";
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
import { isAdministrator, permits } from "@/features/identity/permissions";
import { currentIdentity } from "@/features/identity/server/context";
import {
  closeVendorBillAction,
  createVendorBillAction,
} from "@/features/modul/actions";
import { ActionForm } from "@/features/modul/components/action-form";
import {
  day,
  ListFilter,
  ModulHeader,
  one,
  rupiah,
  StatusText,
  selectClass,
} from "@/features/modul/components/page-bits";
import {
  listVendorBills,
  VENDOR_BILL_CATEGORIES,
  VENDOR_BILL_STATUS,
} from "@/features/modul/server/vendor-bills";
import { businessDateString } from "@/lib/date/business-date";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Pembayaran Hutang" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const current = await currentIdentity();
  if (!current) redirect("/login");
  if (!permits(current.actor, "view", "debt_payment"))
    return (
      <EmptyState
        title="Akses ditolak"
        description="Grup Anda belum memiliki hak lihat Pembayaran Hutang. Minta admin menambahkan hak tersebut."
      />
    );
  const query = await searchParams;
  const values = {
    status: one(query.status),
    search: one(query.search),
    from: one(query.from),
    to: one(query.to),
  };
  const canCreate = permits(current.actor, "create", "debt_payment");
  const canClose = permits(current.actor, "close", "debt_payment");
  const [rows, vendors, branches] = await Promise.all([
    listVendorBills(current.actor, values),
    canCreate
      ? prisma.vendor.findMany({
          where: { deletedAt: null, status: "ACTIVE" },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
          take: 1000,
        })
      : Promise.resolve([]),
    canCreate
      ? prisma.branch.findMany({
          where: {
            deletedAt: null,
            status: "ACTIVE",
            ...(isAdministrator(current.actor)
              ? {}
              : { id: { in: current.actor.branchIds } }),
          },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
          take: 1000,
        })
      : Promise.resolve([]),
  ]);
  const today = businessDateString();
  return (
    <div className="min-w-0 space-y-5">
      <ModulHeader
        title="Pembayaran Hutang"
        info="Daftar invoice dari vendor/agen beserta AWB-nya. Tgl. Pengingat = Tanggal Diterima (atau Tanggal Dibuat) + Term. Tandai Lunas untuk menutup invoice. Catatan: belum membuat jurnal akuntansi; perlakuan jurnal menunggu keputusan finance."
      />
      {canCreate && (
        <details className="rounded-lg border bg-background p-4">
          <summary className="min-h-11 cursor-pointer font-semibold">
            Tambah Pembayaran Hutang
          </summary>
          <ActionForm action={createVendorBillAction} reset className="mt-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="min-w-0 space-y-2">
                <Label htmlFor="vb-branch">Cabang Pemilik</Label>
                <ComboSelect
                  id="vb-branch"
                  name="branchId"
                  required
                  defaultValue={
                    branches.length === 1 ? String(branches[0].id) : ""
                  }
                  className={selectClass}
                >
                  <option value="">Pilih cabang...</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </ComboSelect>
              </div>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="vb-category">Kategori</Label>
                <select
                  id="vb-category"
                  name="category"
                  required
                  defaultValue=""
                  className={selectClass}
                >
                  <option value="">--Please Select--</option>
                  {VENDOR_BILL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="vb-vendor">Vendors</Label>
                <ComboSelect
                  id="vb-vendor"
                  name="vendorId"
                  required
                  defaultValue=""
                  className={selectClass}
                >
                  <option value="">--Please Select--</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </ComboSelect>
              </div>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="vb-date">Tanggal Buat</Label>
                <Input
                  id="vb-date"
                  name="billDate"
                  type="date"
                  required
                  defaultValue={today}
                  className="min-h-11"
                />
              </div>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="vb-no">Invoice No.</Label>
                <Input
                  id="vb-no"
                  name="invoiceNo"
                  maxLength={50}
                  placeholder="Auto Generate When Submit"
                  className="min-h-11"
                />
              </div>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="vb-received">Tanggal Diterima</Label>
                <Input
                  id="vb-received"
                  name="receivedDate"
                  type="date"
                  className="min-h-11"
                />
              </div>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="vb-term">Term (hari)</Label>
                <Input
                  id="vb-term"
                  name="termDays"
                  type="number"
                  min="0"
                  max="365"
                  defaultValue="0"
                  className="min-h-11"
                />
              </div>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="vb-amount">Nominal (Rp)</Label>
                <Input
                  id="vb-amount"
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  className="min-h-11"
                />
              </div>
              <div className="min-w-0 space-y-2 sm:col-span-2">
                <Label htmlFor="vb-awbs">
                  Nomor AWB (opsional; pisahkan dengan baris baru, koma atau
                  spasi)
                </Label>
                <textarea
                  id="vb-awbs"
                  name="awbs"
                  rows={3}
                  maxLength={20000}
                  className="w-full rounded-md border border-input bg-background p-3 text-base md:text-sm"
                />
              </div>
            </div>
          </ActionForm>
        </details>
      )}
      <ListFilter
        action="/finance/debt-payments"
        values={values}
        searchLabel="Invoice No."
        statuses={VENDOR_BILL_STATUS}
      />
      <section
        aria-label="Daftar invoice hutang"
        className="min-w-0 rounded-lg border bg-background"
      >
        {rows.length ? (
          <div className="overflow-x-auto">
            <Table className="min-w-[78rem]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No.</TableHead>
                  <TableHead>Cabang</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Tanggal Dibuat</TableHead>
                  <TableHead>Tanggal Diterima</TableHead>
                  <TableHead className="text-right">Term</TableHead>
                  <TableHead>Tgl. Pengingat</TableHead>
                  <TableHead className="text-right">Nominal (Rp)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal Tutup</TableHead>
                  <TableHead className="text-right">Tot. AWB</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell className="tabular-nums">{index + 1}</TableCell>
                    <TableCell>
                      {row.branch?.name ?? "Belum ditentukan"}
                    </TableCell>
                    <TableCell>{row.category}</TableCell>
                    <TableCell>{row.vendor.name}</TableCell>
                    <TableCell>{row.invoiceNo}</TableCell>
                    <TableCell>{day(row.billDate)}</TableCell>
                    <TableCell>{day(row.receivedDate)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.termDays}
                    </TableCell>
                    <TableCell>{day(row.reminderDate)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {rupiah(row.amount)}
                    </TableCell>
                    <TableCell>
                      <StatusText
                        value={row.status}
                        labels={VENDOR_BILL_STATUS}
                      />
                    </TableCell>
                    <TableCell>{day(row.closedAt)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row._count.items}
                    </TableCell>
                    <TableCell>
                      {row.status === "OPEN" && canClose ? (
                        <ActionForm
                          action={closeVendorBillAction}
                          submit={
                            <Button type="submit" className="min-h-11">
                              Tandai Lunas
                            </Button>
                          }
                        >
                          <input type="hidden" name="id" value={row.id} />
                        </ActionForm>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            title="Belum ada invoice hutang"
            description="Catat invoice vendor lewat Tambah Pembayaran Hutang. Ubah filter untuk melihat data lain."
          />
        )}
      </section>
    </div>
  );
}
