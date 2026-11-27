import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ConfirmSubmit } from "@/components/patterns/confirm-dialog";
import { EmptyState } from "@/components/patterns/content-state";
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
import { permits, permitsBranch } from "@/features/identity/permissions";
import { currentIdentity } from "@/features/identity/server/context";
import { ActionForm } from "@/features/modul/components/action-form";
import { ModulHeader } from "@/features/modul/components/page-bits";
import { OutcomeForm } from "@/features/shipments/components/manifest-forms";
import {
  addAwbToDeliverySheetAction,
  deleteDeliverySheetAction,
  removeAwbFromDeliverySheetAction,
} from "@/features/shipments/delivery-sheet-actions";
import { getStandaloneDeliverySheet } from "@/features/shipments/server/delivery-sheets";
import { businessDateTimeString } from "@/lib/date/business-date";
import { formatRupiah } from "@/lib/format/rupiah";

export const metadata: Metadata = { title: "Detail DRS" };

// Session-dependent page; blocking render.
export const instant = false;

const OUTCOME: Record<string, string> = {
  DELIVERED: "Terkirim",
  FAILED_DELIVERY: "Gagal",
  RETURNED: "Retur",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const actor = current.actor;
  if (!permits(actor, "view", "delivery"))
    return (
      <EmptyState
        title="Akses ditolak"
        description="Grup Anda belum memiliki hak lihat Delivery Sheet."
      />
    );
  const sheet = await getStandaloneDeliverySheet(
    actor,
    Number((await params).id),
  );
  if (!sheet) notFound();
  const canEdit =
    permits(actor, "update", "delivery") &&
    !!sheet.branchId &&
    permitsBranch(actor, sheet.branchId);
  const anyOutcome = sheet.items.some((i) => i.outcome);
  return (
    <div className="min-w-0 space-y-5">
      <Link
        href="/delivery-sheets"
        className="inline-flex min-h-11 items-center text-sm text-primary underline underline-offset-4"
      >
        ← Kembali ke daftar DRS
      </Link>
      <ModulHeader
        title={`DRS ${sheet.sheetNo}`}
        info="Tambahkan AWB yang dibawa kurir, cetak DRS, lalu catat hasil antar per AWB. Terkirim mengubah status AWB menjadi Delivered; Terkirim dan Retur bersifat final. Konfirmasi lewat Scan AWB juga mengisi hasil di sini."
      >
        <a
          href={`/print/delivery-sheets/${sheet.id}`}
          target="_blank"
          rel="noopener"
          className="inline-flex min-h-11 items-center rounded-md border px-4 text-sm"
        >
          Print DRS
        </a>
      </ModulHeader>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border bg-background p-4 text-sm sm:grid-cols-4">
        {(
          [
            ["Tanggal", sheet.date],
            ["Cabang", sheet.branch?.name],
            ["Kurir", sheet.courier?.name],
            ["Driver", sheet.driver?.name],
            [
              "Nopol",
              sheet.vehicle
                ? `${sheet.vehicle.licensePlate} · ${sheet.vehicle.name}`
                : null,
            ],
            ["Agen", sheet.agent?.name],
            ["Keterangan", sheet.remarks],
            ["Dibuat oleh", sheet.createdBy?.name],
            ["Tot. AWB", String(sheet.totals.awb)],
            ["Tot. Koli", String(sheet.totals.koli)],
            ["Tot. Kg", String(sheet.totals.kilo)],
            ["Selesai", `${sheet.totals.done}/${sheet.totals.awb}`],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium [overflow-wrap:anywhere]">
              {value || "-"}
            </dd>
          </div>
        ))}
      </dl>
      {canEdit && (
        <section
          aria-label="Tambah AWB"
          className="rounded-lg border bg-background p-4"
        >
          <ActionForm
            action={addAwbToDeliverySheetAction}
            reset
            submit={
              <Button type="submit" className="min-h-11">
                Tambahkan
              </Button>
            }
          >
            <input type="hidden" name="deliverySheetId" value={sheet.id} />
            <div className="min-w-0 space-y-2">
              <Label htmlFor="drs-awb">Tambah AWB (ketik atau scan)</Label>
              <Input
                id="drs-awb"
                name="awbNo"
                required
                maxLength={50}
                autoComplete="off"
                placeholder="Nomor AWB"
                className="min-h-11"
              />
            </div>
          </ActionForm>
        </section>
      )}
      {sheet.items.length === 0 ? (
        <EmptyState
          title="Belum ada AWB"
          description="Tambahkan AWB yang akan diantar kurir pada DRS ini."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead>
                <TableHead>AWB No.</TableHead>
                <TableHead>Penerima</TableHead>
                <TableHead>Tujuan</TableHead>
                <TableHead className="text-right">Koli</TableHead>
                <TableHead className="text-right">Kg</TableHead>
                <TableHead className="text-right">COD (Rp)</TableHead>
                <TableHead>Status AWB</TableHead>
                <TableHead>Hasil antar</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sheet.items.map((item, index) => {
                const final =
                  item.outcome === "DELIVERED" || item.outcome === "RETURNED";
                return (
                  <TableRow key={item.id} className="align-top">
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium whitespace-nowrap">
                      <Link
                        href={`/transactions/${item.transactionId}`}
                        className="text-primary underline underline-offset-4"
                      >
                        {item.transaction.awbNo ?? "-"}
                      </Link>
                    </TableCell>
                    <TableCell className="min-w-48">
                      <p>{item.transaction.receiverName ?? "-"}</p>
                      <p className="text-xs text-muted-foreground">
                        {[
                          item.transaction.receiverAddress,
                          item.transaction.receiverPhone,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </TableCell>
                    <TableCell>
                      {item.transaction.destinationBranch?.name ?? "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.transaction.koli ?? "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.transaction.kilo?.toString() ?? "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.transaction.codValue
                        ? formatRupiah(item.transaction.codValue, {
                            prefix: false,
                          })
                        : "-"}
                    </TableCell>
                    <TableCell>{item.transaction.status}</TableCell>
                    <TableCell className="min-w-40">
                      {item.outcome ? (
                        <>
                          <p className="font-medium">
                            {OUTCOME[item.outcome] ?? item.outcome}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {[
                              item.receivedBy,
                              businessDateTimeString(item.deliveredAt),
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </>
                      ) : (
                        <span className="text-muted-foreground">
                          Belum dicatat
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {canEdit && !final && (
                        <OutcomeForm
                          deliverySheetId={sheet.id}
                          transactionId={item.transactionId}
                        />
                      )}
                      {canEdit && !item.outcome && (
                        <ActionForm
                          action={removeAwbFromDeliverySheetAction}
                          className="mt-2"
                          submit={
                            <ConfirmSubmit
                              variant="outline"
                              size="sm"
                              className="min-h-11"
                              title={`Hapus AWB ${item.transaction.awbNo ?? ""} dari DRS?`}
                              description="AWB bisa ditambahkan lagi ke DRS ini atau DRS lain."
                              confirmLabel="Ya, hapus"
                            >
                              Hapus dari DRS
                            </ConfirmSubmit>
                          }
                        >
                          <input
                            type="hidden"
                            name="deliverySheetId"
                            value={sheet.id}
                          />
                          <input
                            type="hidden"
                            name="transactionId"
                            value={item.transactionId}
                          />
                        </ActionForm>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      {canEdit && !anyOutcome && (
        <ActionForm
          action={deleteDeliverySheetAction}
          submit={
            <ConfirmSubmit
              variant="destructive"
              className="min-h-11"
              title={`Hapus DRS ${sheet.sheetNo}?`}
              description="DRS dan daftar AWB-nya dihapus. AWB tidak terhapus dan bisa dimasukkan ke DRS lain."
              confirmLabel="Ya, hapus DRS"
            >
              Hapus DRS
            </ConfirmSubmit>
          }
        >
          <input type="hidden" name="deliverySheetId" value={sheet.id} />
        </ActionForm>
      )}
    </div>
  );
}
