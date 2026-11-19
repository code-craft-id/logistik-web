import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/patterns/content-state";
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
import { decideAwbChangeAction } from "@/features/modul/actions";
import { ActionForm } from "@/features/modul/components/action-form";
import { FIELD_LABELS } from "@/features/modul/components/awb-change-panel";
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
                        {row.createdAt
                          .toISOString()
                          .slice(0, 16)
                          .replace("T", " ")}
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
                                  {FIELD_LABELS[key] ?? key}: {before ?? "-"} →{" "}
                                  {after ?? "-"}
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
                      <TableCell className="min-w-56">
                        {row.status === "PENDING" && canApprove ? (
                          <ActionForm
                            action={decideAwbChangeAction}
                            submit={
                              <>
                                <Button
                                  type="submit"
                                  name="decision"
                                  value="APPROVE"
                                  className="min-h-11"
                                >
                                  Setujui{" "}
                                  {AWB_CHANGE_KINDS[
                                    row.kind as "EDIT"
                                  ]?.toLowerCase()}
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
                            <input type="hidden" name="id" value={row.id} />
                            <Input
                              name="note"
                              maxLength={500}
                              placeholder="Catatan (opsional)"
                              aria-label={`Catatan keputusan untuk AWB ${row.transaction.awbNo ?? row.transaction.id}`}
                              className="min-h-11"
                            />
                          </ActionForm>
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
