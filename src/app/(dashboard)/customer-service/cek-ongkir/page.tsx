import type { Metadata } from "next";
import Form from "next/form";
import { redirect } from "next/navigation";
import { ConfirmSubmit } from "@/components/patterns/confirm-dialog";
import { EmptyState } from "@/components/patterns/content-state";
import { Button } from "@/components/ui/button";
import { ComboSelect } from "@/components/ui/combo-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
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
import { deleteTariffAction, saveTariffAction } from "@/features/modul/actions";
import { ActionForm } from "@/features/modul/components/action-form";
import {
  ModulHeader,
  one,
  rupiah,
  selectClass,
} from "@/features/modul/components/page-bits";
import { branchChoices } from "@/features/modul/server/inbound";
import { checkTariffs } from "@/features/modul/server/tariffs";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Cek Ongkir" };

// Session- and query-dependent page; blocking render.
export const instant = false;

function BranchSelect({
  id,
  name,
  label,
  value,
  branches,
  required,
}: {
  id: string;
  name: string;
  label: string;
  value?: string;
  branches: { id: number; name: string }[];
  required?: boolean;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <ComboSelect
        id={id}
        name={name}
        defaultValue={value ?? ""}
        required={required}
        className={selectClass}
      >
        <option value="">{required ? "Pilih…" : "Semua"}</option>
        {branches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </ComboSelect>
    </div>
  );
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const current = await currentIdentity();
  if (!current) redirect("/login");
  if (!permits(current.actor, "view", "tariff"))
    return (
      <EmptyState
        title="Akses ditolak"
        description="Grup Anda belum memiliki hak lihat Tarif / Cek Ongkir. Minta admin menambahkan hak tersebut."
      />
    );
  const query = await searchParams;
  const from = one(query.from) ?? "";
  const to = one(query.to) ?? "";
  const weight = one(query.weight) ?? "";
  const canManage = permits(current.actor, "manage", "tariff");
  const [branches, rows, services] = await Promise.all([
    branchChoices(),
    checkTariffs(current.actor, {
      origin: Number(from) || undefined,
      destination: Number(to) || undefined,
      weight,
    }),
    canManage
      ? prisma.deliveryService.findMany({
          where: { deletedAt: null, status: "ACTIVE" },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);
  return (
    <div className="min-w-0 space-y-5">
      <ModulHeader
        title="Daftar Cek Ongkir"
        info="Tarif per rute cabang. Tarif = Tarif per Kg x berat (minimal Berat Min.). Isi berat untuk melihat perkiraan ongkir; tanpa berat, kolom Tarif memakai Berat Min. Angka ini perkiraan dan tidak membuat transaksi."
      />
      <Form
        action="/customer-service/cek-ongkir"
        className="grid items-end gap-3 rounded-lg border bg-background p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_10rem_auto]"
      >
        <BranchSelect
          id="co-from"
          name="from"
          label="Dari"
          value={from}
          branches={branches}
        />
        <BranchSelect
          id="co-to"
          name="to"
          label="Ke"
          value={to}
          branches={branches}
        />
        <div className="min-w-0 space-y-2">
          <Label htmlFor="co-weight">Berat (kg)</Label>
          <Input
            id="co-weight"
            name="weight"
            type="number"
            min="0"
            step="0.01"
            defaultValue={weight}
            className="min-h-11"
          />
        </div>
        <Button type="submit" className="min-h-11">
          Cek
        </Button>
      </Form>
      <section
        aria-label="Daftar tarif"
        className="min-w-0 rounded-lg border bg-background"
      >
        {rows.length ? (
          <div className="overflow-x-auto">
            <Table className="min-w-[48rem]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No.</TableHead>
                  <TableHead>Layanan</TableHead>
                  <TableHead>Origin</TableHead>
                  <TableHead>Tujuan</TableHead>
                  <TableHead className="text-right">Berat Min. (kg)</TableHead>
                  <TableHead className="text-right">
                    Tarif per Kg (Rp)
                  </TableHead>
                  <TableHead className="text-right">Tarif (Rp)</TableHead>
                  <TableHead>Estimasi</TableHead>
                  {canManage && <TableHead>Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell className="tabular-nums">{index + 1}</TableCell>
                    <TableCell>{row.service ?? "Semua layanan"}</TableCell>
                    <TableCell>{row.origin}</TableCell>
                    <TableCell>{row.destination}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.minWeight}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {rupiah(row.pricePerKg)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {rupiah(row.charge)}
                    </TableCell>
                    <TableCell>{row.eta ?? "-"}</TableCell>
                    {canManage && (
                      <TableCell>
                        <ActionForm
                          action={deleteTariffAction}
                          submit={
                            <ConfirmSubmit
                              variant="outline"
                              className="min-h-11"
                              title="Hapus tarif ini?"
                              description={`Tarif ${row.origin} → ${row.destination} tidak dipakai lagi untuk hitung ongkir.`}
                            >
                              Hapus
                            </ConfirmSubmit>
                          }
                        >
                          <input type="hidden" name="id" value={row.id} />
                        </ActionForm>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            title="Tarif belum tersedia"
            description={
              canManage
                ? "Belum ada tarif untuk rute ini. Tambahkan tarif di form Kelola Tarif di bawah."
                : "Belum ada tarif untuk rute ini. Hubungi admin untuk menambahkan tarif."
            }
          />
        )}
      </section>
      {canManage && (
        <section
          aria-labelledby="tariff-form"
          className="space-y-3 rounded-lg border bg-background p-4"
        >
          <h2 id="tariff-form" className="font-semibold">
            Kelola Tarif
          </h2>
          <ActionForm action={saveTariffAction} reset>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <BranchSelect
                id="t-origin"
                name="originBranchId"
                label="Origin"
                branches={branches}
                required
              />
              <BranchSelect
                id="t-dest"
                name="destinationBranchId"
                label="Tujuan"
                branches={branches}
                required
              />
              <div className="min-w-0 space-y-2">
                <Label htmlFor="t-service">Layanan</Label>
                <ComboSelect
                  id="t-service"
                  name="deliveryServiceId"
                  defaultValue=""
                  className={selectClass}
                >
                  <option value="">Semua layanan</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </ComboSelect>
              </div>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="t-min">Berat Min. (kg)</Label>
                <Input
                  id="t-min"
                  name="minWeight"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue="1"
                  required
                  className="min-h-11"
                />
              </div>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="t-price">Tarif per Kg (Rp)</Label>
                <MoneyInput
                  id="t-price"
                  name="pricePerKg"
                  required
                  className="min-h-11"
                />
              </div>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="t-eta">Estimasi</Label>
                <Input
                  id="t-eta"
                  name="eta"
                  maxLength={50}
                  placeholder="contoh: 2-3 hari"
                  className="min-h-11"
                />
              </div>
            </div>
          </ActionForm>
        </section>
      )}
    </div>
  );
}
