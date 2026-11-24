import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/patterns/content-state";
import { FormDialog } from "@/components/patterns/form-dialog";
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
import { currentIdentity } from "@/features/identity/server/context";
import { decideAwbChangeAction } from "@/features/modul/actions";
import {
  FIELD_LABELS,
  showValue,
} from "@/features/modul/components/awb-change-panel";
import {
  ListFilter,
  ModulHeader,
  one,
  StatusText,
} from "@/features/modul/components/page-bits";
import {
  AWB_CHANGE_KINDS,
  AWB_CHANGE_STATUS,
  listAwbChanges,
} from "@/features/modul/server/awb-changes";
import { businessDateTimeString } from "@/lib/date/business-date";

export const metadata: Metadata = { title: "Persetujuan Edit/delete AWB" };

// Session- and query-dependent page; blocking render.
export const instant = false;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const current = await currentIdentity();
  if (!current) redirect("/login");
  if (!permits(current.actor, "view", "awb_change"))
    return (
      <EmptyState
        title="Akses ditolak"
        description="Grup Anda belum memiliki hak lihat Persetujuan Edit/Delete AWB. Minta admin menambahkan hak tersebut."
      />
    );
  const query = await searchParams;
  const values = {
    status: one(query.status) ?? "PENDING",
    search: one(query.search),
    from: one(query.from),
    to: one(query.to),
  };
  const rows = await listAwbChanges(current.actor, {
    ...values,
    status: values.status === "ALL" ? undefined : values.status,
  });
  const canApprove = permits(current.actor, "approve", "awb_change");
  return (
    <div className="min-w-0 space-y-5">
      <ModulHeader
        title="AWB Modified Request"
        info="Pengajuan edit atau hapus AWB dari cabang. Pengajuan dibuat dari halaman detail AWB. Hapus yang disetujui langsung menghapus AWB (ditolak bila AWB masih di manifest, lembar pengantaran, invoice, jurnal, POD Kembali atau hutang). Edit yang disetujui membuka form edit satu kali di detail AWB."
      />
      <ListFilter
        action="/transactions/approvals"
        values={values}
        searchLabel="AWB No."
        statuses={{ ALL: "Semua", ...AWB_CHANGE_STATUS }}
      />
      <section
        aria-label="Daftar pengajuan"
        className="min-w-0 rounded-lg border bg-background"
      >
        {rows.length ? (
          <div className="overflow-x-auto">
            <Table className="min-w-[64rem]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No.</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>AWB No.</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status Edit</TableHead>
                  <TableHead>Status Delete</TableHead>
                  <TableHead>Approve By</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => {
                  const status = (
                    <StatusText value={row.status} labels={AWB_CHANGE_STATUS} />
                  );
                  const changes = row.changes as Record<
                    string,
                    [string | null, string | null]
                  > | null;
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="tabular-nums">
                        {index + 1}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {businessDateTimeString(row.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/transactions/${row.transaction.id}`}
                          className="text-primary underline underline-offset-4"
                        >
                          {row.transaction.awbNo ?? `#${row.transaction.id}`}
                        </Link>
                      </TableCell>
                      <TableCell>{row.requestedBy?.name ?? "-"}</TableCell>
                      <TableCell className="max-w-72 whitespace-normal [overflow-wrap:anywhere]">
                        {row.reason}
                        {changes && (
                          <ul className="mt-1 text-xs text-muted-foreground">
                            {Object.entries(changes).map(
                              ([key, [before, after]]) => (
                                <li key={key}>
                                  {FIELD_LABELS[key] ?? key}:{" "}
                                  {showValue(key, before)} →{" "}
                                  {showValue(key, after)}
                                </li>
                              ),
                            )}
                          </ul>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.kind === "EDIT" ? status : "-"}
                      </TableCell>
                      <TableCell>
                        {row.kind === "DELETE" ? status : "-"}
                      </TableCell>
                      <TableCell>
                        {row.decidedBy?.name ?? "-"}
                        {row.decisionNote && (
                          <span className="block text-xs text-muted-foreground">
                            {row.decisionNote}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.status === "PENDING" && canApprove ? (
                          <FormDialog
                            trigger="Putuskan"
                            title={`${AWB_CHANGE_KINDS[row.kind as "EDIT"] ?? row.kind} AWB ${row.transaction?.awbNo ?? ""}`}
                            description={
                              row.kind === "DELETE"
                                ? "Setujui hapus: AWB langsung dihapus dari daftar dan tidak bisa dibatalkan dari layar."
                                : "Setujui atau tolak pengajuan ini. Catatan boleh dikosongkan."
                            }
                            action={decideAwbChangeAction}
                            buttons={
                              <>
                                <Button
                                  type="submit"
                                  name="decision"
                                  value="REJECT"
                                  variant="outline"
                                  className="min-h-11"
                                >
                                  Tolak
                                </Button>
                                <Button
                                  type="submit"
                                  name="decision"
                                  value="APPROVE"
                                  variant={
                                    row.kind === "DELETE"
                                      ? "destructive"
                                      : "default"
                                  }
                                  className="min-h-11"
                                >
                                  {row.kind === "DELETE"
                                    ? "Setujui hapus"
                                    : `Setujui ${AWB_CHANGE_KINDS[row.kind as "EDIT"]?.toLowerCase() ?? ""}`}
                                </Button>
                              </>
                            }
                          >
                            <input type="hidden" name="id" value={row.id} />
                            <label className="grid gap-1 text-sm font-medium">
                              Catatan (opsional)
                              <input
                                name="note"
                                maxLength={500}
                                className="min-h-11 rounded-md border bg-background px-3"
                              />
                            </label>
                          </FormDialog>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            title="Tidak ada pengajuan"
            description="Pengajuan edit/hapus AWB dibuat dari halaman detail AWB (tombol Ajukan Edit / Ajukan Hapus). Ubah filter status untuk melihat yang sudah diputuskan."
          />
        )}
      </section>
    </div>
  );
}
