import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { EmptyState } from "@/components/patterns/content-state";
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
import {
  AssignAwbForm,
  DeliverySheetForm,
  OutcomeForm,
} from "@/features/shipments/components/manifest-forms";
import { getManifest } from "@/features/shipments/server/manifests-queries";
import { requirePermission } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Detail Manifest" };

// Session-dependent page; blocking render like the Dev 2 transaction detail.
export const instant = false;

const link =
  "inline-flex min-h-11 items-center text-primary underline underline-offset-4";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("view", "manifest");
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const parsed = z.coerce
    .number()
    .int()
    .positive()
    .safeParse((await params).id);
  if (!parsed.success) notFound();
  const manifest = await getManifest(current.actor, parsed.data);
  if (!manifest) notFound();
  const facts: [string, string | number | null][] = [
    ["Tanggal", manifest.date],
    ["Jenis", manifest.type],
    ["Status", manifest.status],
    ["Cabang pemilik", manifest.branch],
    ["Asal", manifest.origin],
    ["Tujuan", manifest.destination],
    ["Transit", manifest.transit.join(", ") || null],
    ["Kendaraan", manifest.vehicle],
    ["Kurir", manifest.courier],
    ["Vendor", manifest.vendor],
    ["Dibuat oleh", manifest.createdBy],
    ["Tot. AWB", manifest.awb],
    ["Tot. Koli", manifest.koli],
    ["Tot. Berat (kg)", manifest.kilo],
    ["Tot. Volume", manifest.volume],
  ];
  const canAssign =
    manifest.assignable && permits(current.actor, "update", "manifest");
  const canCreateDrs =
    !manifest.deliverySheet &&
    manifest.assignable &&
    permits(current.actor, "create", "delivery");
  const sheet = manifest.deliverySheet;
  const canRecord = !!sheet && permits(current.actor, "update", "delivery");
  const outcomeLabel: Record<string, string> = {
    DELIVERED: "Terkirim",
    FAILED_DELIVERY: "Gagal",
    RETURNED: "Retur",
  };
  return (
    <div className="min-w-0 space-y-5 [overflow-wrap:anywhere]">
      <header className="space-y-1">
        <Link href="/manifest" className={`${link} text-sm`}>
          Kembali ke daftar manifest
        </Link>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Manifest {manifest.manifestNo}
        </h1>
        <nav aria-label="Cetak" className="flex flex-wrap gap-4">
          <Link className={link} href={`/manifest/${manifest.id}/print`}>
            Print Manifest
          </Link>
          {manifest.deliverySheet && (
            <Link
              className={link}
              href={`/manifest/${manifest.id}/print?doc=drs`}
            >
              Print DRS
            </Link>
          )}
        </nav>
      </header>
      <section
        aria-label="Ringkasan manifest"
        className="rounded-lg border bg-background p-4 sm:p-6"
      >
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="font-medium tabular-nums">
                {value ?? "Tidak tersedia"}
              </dd>
            </div>
          ))}
        </dl>
      </section>
      {canAssign && (
        <section
          aria-label="Tambah AWB ke manifest"
          className="rounded-lg border bg-background p-4 sm:p-6"
        >
          <AssignAwbForm manifestId={manifest.id} />
        </section>
      )}
      <section
        aria-label="Lembar pengantaran"
        className="rounded-lg border bg-background p-4 sm:p-6"
      >
        <h2 className="mb-3 font-semibold">Lembar Pengantaran (DRS)</h2>
        {sheet ? (
          <p className="text-sm">
            DRS <strong>{sheet.sheetNo}</strong> · tanggal antar {sheet.date}.
            Catat hasil antar per AWB di tabel di bawah.
          </p>
        ) : canCreateDrs ? (
          <DeliverySheetForm
            manifestId={manifest.id}
            suggestedNo={`DRS-${manifest.manifestNo}`}
            today={new Date().toISOString().slice(0, 10)}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Belum ada DRS untuk manifest ini.
          </p>
        )}
      </section>
      <section
        aria-label="AWB dalam manifest"
        className="min-w-0 rounded-lg border bg-background"
      >
        <h2 className="border-b p-4 font-semibold">AWB dalam manifest</h2>
        {manifest.items.length ? (
          <div className="overflow-x-auto">
            <Table className="min-w-[48rem]">
              <TableHeader>
                <TableRow>
                  {[
                    "AWB No.",
                    "DO No.",
                    "Penerima",
                    "Tujuan",
                    "Koli",
                    "Berat (kg)",
                    "Volume",
                    "Status",
                    ...(sheet ? ["Hasil antar"] : []),
                  ].map((h) => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {manifest.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {permits(current.actor, "view", "transaction") ? (
                        <Link
                          className={link}
                          href={`/transactions/${item.transactionId}`}
                        >
                          {item.awbNo ?? "Tanpa nomor"}
                        </Link>
                      ) : (
                        (item.awbNo ?? "Tanpa nomor")
                      )}
                    </TableCell>
                    <TableCell>{item.doNo ?? "—"}</TableCell>
                    <TableCell>{item.receiver ?? "—"}</TableCell>
                    <TableCell>{item.destination ?? "—"}</TableCell>
                    <TableCell className="tabular-nums">
                      {item.koli ?? "—"}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {item.kilo ?? "—"}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {item.volume ?? "—"}
                    </TableCell>
                    <TableCell>{item.status}</TableCell>
                    {sheet && (
                      <TableCell>
                        {item.outcome ? (
                          <span>
                            {outcomeLabel[item.outcome] ?? item.outcome}
                            {item.receivedBy ? ` · ${item.receivedBy}` : ""}
                          </span>
                        ) : null}
                        {canRecord &&
                          item.outcome !== "DELIVERED" &&
                          item.outcome !== "RETURNED" && (
                            <OutcomeForm
                              manifestId={manifest.id}
                              deliverySheetId={sheet.id}
                              transactionId={item.transactionId}
                            />
                          )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            title="Belum ada AWB"
            description="Tambahkan AWB ke manifest ini dengan nomor AWB."
          />
        )}
      </section>
    </div>
  );
}
