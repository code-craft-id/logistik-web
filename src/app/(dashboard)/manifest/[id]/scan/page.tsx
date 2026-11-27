import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { InfoTip } from "@/components/patterns/info-tip";
import { Button } from "@/components/ui/button";
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
import { currentIdentity } from "@/features/identity/server/context";
import { ActionForm } from "@/features/modul/components/action-form";
import { ModulError } from "@/features/modul/server/common";
import { ManifestScanBox } from "@/features/shipments/components/manifest-scan-box";
import { moveToManifestAction } from "@/features/shipments/manifest-scan-actions";
import {
  manifestScanView,
  SCAN_KINDS,
  type ScanKind,
} from "@/features/shipments/server/manifest-scan";
import { requirePagePermission } from "@/lib/auth/page-access";
import { formatRupiah } from "@/lib/format/rupiah";

export const metadata: Metadata = { title: "Scan Koli Manifest" };

// Session- and data-dependent; blocking render.
export const instant = false;

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePagePermission("view", "manifest");
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const q = await searchParams;
  const kind: ScanKind = q.kind === "INBOUND" ? "INBOUND" : "TRANSIT";
  let view: Awaited<ReturnType<typeof manifestScanView>>;
  try {
    view = await manifestScanView(current.actor, id, kind);
  } catch (error) {
    if (error instanceof ModulError)
      return (
        <div className="space-y-3">
          <h1 className="text-xl font-semibold">Scan {SCAN_KINDS[kind]}</h1>
          <p role="alert" className="rounded-md border p-3 text-sm">
            {error.message}
          </p>
          <Link
            href={`/manifest?type=${kind === "INBOUND" ? "Inbound" : "Transit"}`}
            className="text-primary underline underline-offset-4"
          >
            Kembali
          </Link>
        </div>
      );
    throw error;
  }
  const canScan = permits(current.actor, "update", "manifest");
  const back = `/manifest?type=${kind === "INBOUND" ? "Inbound" : "Transit"}`;
  const canMove = permits(current.actor, "update", "manifest");
  return (
    <div className="min-w-0 space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Scan {SCAN_KINDS[kind]} · {view.manifest.manifestNo}
          </h1>
          <InfoTip
            text={
              kind === "TRANSIT"
                ? "Scan setiap koli yang tiba di cabang transit: label koli AWB-n mencatat koli itu, nomor AWB saja mencatat koli berikutnya. Scan pertama mengisi User Transit dan Transit Date di Cek Transit."
                : "Scan setiap koli yang tiba di cabang tujuan. Scan pertama sebuah AWB mengisi Acc. In di Status Pengantaran."
            }
          />
        </div>
        <Button asChild variant="outline" className="min-h-11">
          <Link href={back}>Kembali</Link>
        </Button>
      </header>
      <dl className="grid grid-cols-2 gap-3 rounded-lg border bg-background p-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">No. Manifest</dt>
          <dd className="font-mono font-medium">{view.manifest.manifestNo}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">
            {kind === "TRANSIT" ? "Transit Ke-" : "Status"}
          </dt>
          <dd className="font-medium">
            {kind === "TRANSIT"
              ? (view.transitNo ?? "-")
              : view.manifest.status}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Driver</dt>
          <dd className="font-medium">{view.manifest.courier ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Nopol</dt>
          <dd className="font-medium">{view.manifest.plate ?? "-"}</dd>
        </div>
      </dl>
      {canScan ? (
        <ManifestScanBox manifestId={id} kind={kind} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Grup Anda belum punya hak Manifest: ubah untuk scan koli.
        </p>
      )}
      <section
        aria-label="Daftar AWB manifest"
        className="min-w-0 rounded-lg border bg-background"
      >
        <div className="overflow-x-auto">
          <Table className="min-w-[60rem]">
            <TableHeader>
              <TableRow>
                {[
                  "No.",
                  "AWB No.",
                  "Pengirim",
                  "Penerima",
                  "Biaya Kirim",
                  "Berat Terbesar",
                  "Total Koli",
                  "Scan Koli",
                  "Sisa Koli",
                  "Pindah Manifest",
                  "Pilih",
                ].map((h) => (
                  <TableHead key={h} className="whitespace-nowrap">
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {view.rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="p-4 text-center text-muted-foreground"
                  >
                    Manifest ini belum berisi AWB.
                  </TableCell>
                </TableRow>
              ) : (
                view.rows.map((r, i) => {
                  const done = Math.min(r.scanned, r.koli);
                  return (
                    <TableRow
                      key={r.transactionId}
                      className={done === r.koli ? "bg-primary/10" : undefined}
                    >
                      <TableCell className="tabular-nums">{i + 1}</TableCell>
                      <TableCell className="font-mono">{r.awbNo}</TableCell>
                      <TableCell>{r.sender ?? "-"}</TableCell>
                      <TableCell>{r.receiver ?? "-"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatRupiah(r.fee, { prefix: false })}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.heaviest ?? "-"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.koli}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {done}/{r.koli}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {r.koli - done}/{r.koli}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {r.movedTo ?? ""}
                      </TableCell>
                      <TableCell>
                        {canMove && !r.movedTo && r.scanned > 0 && (
                          <input
                            type="checkbox"
                            name="transactionId"
                            value={r.transactionId}
                            form="move-manifest"
                            aria-label={`Pilih AWB ${r.awbNo} untuk dipindah`}
                            className="size-5 accent-primary"
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={6} className="text-right font-semibold">
                  GRAND TOTAL
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {view.totalKoli}
                </TableCell>
                <TableCell className="tabular-nums">
                  {view.totalScanned}/{view.totalKoli}
                </TableCell>
                <TableCell className="tabular-nums">
                  {view.totalKoli - view.totalScanned}/{view.totalKoli}
                </TableCell>
                <TableCell />
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </section>
      {canMove && (
        <section
          aria-label="Pindah Manifest"
          className="rounded-lg border bg-background p-4"
        >
          <ActionForm
            id="move-manifest"
            action={moveToManifestAction}
            className="grid gap-3 sm:grid-cols-[auto_minmax(0,20rem)_auto] sm:items-end"
            submit={
              <Button type="submit" className="min-h-11">
                Submit
              </Button>
            }
          >
            <input type="hidden" name="manifestId" value={view.manifest.id} />
            <input type="hidden" name="kind" value={kind} />
            <p className="text-sm sm:pb-3">
              Centang AWB yang sudah di-scan, pilih manifest tujuan.
            </p>
            <label className="grid gap-1 text-sm font-medium">
              Pilih Manifest
              <select
                name="targetManifestId"
                required
                defaultValue=""
                className="min-h-11 rounded-md border bg-background px-3"
              >
                <option value="">Pilih Manifest…</option>
                {view.targets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.manifestNo}/{t.destination}
                  </option>
                ))}
              </select>
            </label>
          </ActionForm>
          {view.targets.length === 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Belum ada manifest lain ke tujuan yang sama yang belum tiba.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
