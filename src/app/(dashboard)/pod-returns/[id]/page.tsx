import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EmptyState } from "@/components/patterns/content-state";
import { Button } from "@/components/ui/button";
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
import { decidePodReturnAction } from "@/features/modul/actions";
import { ActionForm } from "@/features/modul/components/action-form";
import { day, StatusText } from "@/features/modul/components/page-bits";
import {
  getPodReturn,
  POD_RETURN_STATUS,
} from "@/features/modul/server/pod-returns";

export const metadata: Metadata = { title: "Detail POD Kembali" };

// Session-dependent page; blocking render.
export const instant = false;

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const current = await currentIdentity();
  if (!current) redirect("/login");
  if (!permits(current.actor, "view", "pod_return"))
    return (
      <EmptyState
        title="Akses ditolak"
        description="Grup Anda belum memiliki hak lihat POD Kembali."
      />
    );
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const doc = await getPodReturn(current.actor, id);
  if (!doc) notFound();
  const canDecide =
    doc.status === "PENDING" &&
    permits(current.actor, "approve", "pod_return") &&
    permitsBranch(current.actor, doc.destinationBranchId);
  return (
    <div className="min-w-0 space-y-5">
      <Link
        href="/pod-returns"
        className="inline-flex min-h-11 items-center text-sm text-primary underline underline-offset-4"
      >
        Kembali ke POD Kembali
      </Link>
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {doc.returnNo}
        </h1>
        <StatusText value={doc.status} labels={POD_RETURN_STATUS} />
      </header>
      <dl className="grid gap-3 rounded-lg border bg-background p-4 sm:grid-cols-2 lg:grid-cols-3">
        {(
          [
            ["Tanggal", day(doc.returnDate)],
            ["Asal", doc.originBranch.name],
            ["Tujuan POD", doc.destinationBranch.name],
            ["Driver", doc.driver?.name],
            ["Keterangan", doc.notes],
            ["Dibuat oleh", doc.createdBy?.name],
            ["Diputuskan oleh", doc.decidedBy?.name],
            [
              "Waktu keputusan",
              doc.decidedAt?.toISOString().slice(0, 16).replace("T", " "),
            ],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="font-medium [overflow-wrap:anywhere]">
              {value ?? "-"}
            </dd>
          </div>
        ))}
      </dl>
      {canDecide && (
        <ActionForm
          action={decidePodReturnAction}
          submit={
            <>
              <Button
                type="submit"
                name="decision"
                value="APPROVE"
                className="min-h-11"
              >
                Setujui
              </Button>
              <Button
                type="submit"
                name="decision"
                value="REJECT"
                variant="outline"
                className="min-h-11"
              >
                Tolak
              </Button>
            </>
          }
        >
          <input type="hidden" name="id" value={doc.id} />
        </ActionForm>
      )}
      <section
        aria-label="Daftar AWB"
        className="min-w-0 rounded-lg border bg-background"
      >
        <div className="overflow-x-auto">
          <Table className="min-w-[32rem]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No.</TableHead>
                <TableHead>AWB No.</TableHead>
                <TableHead>Penerima</TableHead>
                <TableHead className="text-right">Koli</TableHead>
                <TableHead className="text-right">Berat (kg)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doc.items.map(({ transaction: t }, index) => (
                <TableRow key={t.id}>
                  <TableCell className="tabular-nums">{index + 1}</TableCell>
                  <TableCell>
                    <Link
                      href={`/transactions/${t.id}`}
                      className="text-primary underline underline-offset-4"
                    >
                      {t.awbNo ?? `#${t.id}`}
                    </Link>
                  </TableCell>
                  <TableCell>{t.receiverName ?? "-"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {t.koli ?? "-"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {t.kilo?.toString() ?? "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
