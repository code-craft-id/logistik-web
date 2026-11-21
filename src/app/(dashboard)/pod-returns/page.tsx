import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/patterns/content-state";
import { PageTabs } from "@/components/patterns/page-tabs";
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
import {
  isAdministrator,
  permits,
  permitsBranch,
} from "@/features/identity/permissions";
import { currentIdentity } from "@/features/identity/server/context";
import {
  createPodReturnAction,
  decidePodReturnAction,
} from "@/features/modul/actions";
import { ActionForm } from "@/features/modul/components/action-form";
import {
  day,
  ListFilter,
  ModulHeader,
  one,
  StatusText,
  selectClass,
} from "@/features/modul/components/page-bits";
import { branchChoices } from "@/features/modul/server/inbound";
import {
  listPodReturns,
  POD_RETURN_STATUS,
} from "@/features/modul/server/pod-returns";
import { businessDateString } from "@/lib/date/business-date";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "POD Kembali" };

// Session- and query-dependent page; blocking render.
export const instant = false;

const tabs = [
  { key: "list", label: "POD Kembali", href: "/pod-returns" },
  {
    key: "approval",
    label: "Approval Pod Kembali",
    href: "/pod-returns?tab=approval",
  },
];

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const actor = current.actor;
  if (!permits(actor, "view", "pod_return"))
    return (
      <EmptyState
        title="Akses ditolak"
        description="Grup Anda belum memiliki hak lihat POD Kembali. Minta admin menambahkan hak tersebut."
      />
    );
  const query = await searchParams;
  const approval = one(query.tab) === "approval";
  const values = {
    status: one(query.status) ?? (approval ? "PENDING" : undefined),
    search: one(query.search),
    from: one(query.from),
    to: one(query.to),
  };
  const canCreate = !approval && permits(actor, "create", "pod_return");
  const canApprove = permits(actor, "approve", "pod_return");
  const [rows, branches, drivers] = await Promise.all([
    listPodReturns(actor, {
      ...values,
      status: values.status === "ALL" ? undefined : values.status,
    }),
    branchChoices(),
    canCreate
      ? prisma.driver.findMany({
          where: {
            deletedAt: null,
            status: "ACTIVE",
            ...(isAdministrator(actor)
              ? {}
              : {
                  OR: [
                    { branchId: { in: actor.branchIds } },
                    { branchId: null },
                  ],
                }),
          },
          select: { id: true, name: true, branch: { select: { name: true } } },
          orderBy: { name: "asc" },
          take: 1000,
        })
      : Promise.resolve([]),
  ]);
  const ownBranches = branches.filter((b) => permitsBranch(actor, b.id));
  return (
    <div className="min-w-0 space-y-5">
      <PageTabs
        label="POD Kembali"
        tabs={tabs}
        active={approval ? "approval" : "list"}
      />
      <ModulHeader
        title={approval ? "Manage Approval Pod Kembali" : "Manage POD Kembali"}
        info={
          approval
            ? "Dokumen POD Kembali yang dikirim ke cabang Anda. Hanya cabang tujuan yang boleh menyetujui atau menolak."
            : "Dokumen bukti terima (POD) yang dikirim balik ke cabang lain. Isi nomor AWB berstatus Delivered; nomor dokumen dibuat otomatis (POD-YYYYMMDD-urut)."
        }
      />
      {canCreate && (
        <details className="rounded-lg border bg-background p-4">
          <summary className="min-h-11 cursor-pointer font-semibold">
            Tambah POD Kembali
          </summary>
          <ActionForm action={createPodReturnAction} className="mt-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="min-w-0 space-y-2">
                <Label htmlFor="pr-date">Tanggal</Label>
                <Input
                  id="pr-date"
                  name="returnDate"
                  type="date"
                  required
                  defaultValue={businessDateString()}
                  className="min-h-11"
                />
              </div>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="pr-origin">Cabang asal</Label>
                <ComboSelect
                  id="pr-origin"
                  name="originBranchId"
                  required
                  defaultValue={
                    ownBranches.length === 1 ? String(ownBranches[0].id) : ""
                  }
                  className={selectClass}
                >
                  <option value="">Pilih…</option>
                  {ownBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </ComboSelect>
              </div>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="pr-dest">Tujuan POD</Label>
                <ComboSelect
                  id="pr-dest"
                  name="destinationBranchId"
                  required
                  defaultValue=""
                  className={selectClass}
                >
                  <option value="">Select Branch …</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </ComboSelect>
              </div>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="pr-driver">Driver</Label>
                <ComboSelect
                  id="pr-driver"
                  name="driverId"
                  defaultValue=""
                  className={selectClass}
                >
                  <option value="">Select Driver …</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.branch ? `${d.name} | ${d.branch.name}` : d.name}
                    </option>
                  ))}
                </ComboSelect>
              </div>
              <div className="min-w-0 space-y-2 sm:col-span-2">
                <Label htmlFor="pr-notes">Keterangan</Label>
                <Input
                  id="pr-notes"
                  name="notes"
                  maxLength={500}
                  className="min-h-11"
                />
              </div>
              <div className="min-w-0 space-y-2 sm:col-span-2 lg:col-span-3">
                <Label htmlFor="pr-awbs">
                  Nomor AWB (pisahkan dengan baris baru, koma atau spasi)
                </Label>
                <textarea
                  id="pr-awbs"
                  name="awbs"
                  required
                  rows={4}
                  maxLength={20000}
                  className="w-full rounded-md border border-input bg-background p-3 text-base md:text-sm"
                />
              </div>
            </div>
          </ActionForm>
        </details>
      )}
      <ListFilter
        action="/pod-returns"
        hidden={approval ? { tab: "approval" } : undefined}
        values={values}
        searchLabel="No. POD Kembali"
        statuses={{ ALL: "Semua", ...POD_RETURN_STATUS }}
      />
      <section
        aria-label="Daftar POD Kembali"
        className="min-w-0 rounded-lg border bg-background"
      >
        {rows.length ? (
          <div className="overflow-x-auto">
            <Table className="min-w-[64rem]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No.</TableHead>
                  <TableHead>No. POD Kembali</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Asal</TableHead>
                  <TableHead>Tujuan</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Tot. AWB</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell className="tabular-nums">{index + 1}</TableCell>
                    <TableCell>
                      <Link
                        href={`/pod-returns/${row.id}`}
                        className="text-primary underline underline-offset-4"
                      >
                        {row.returnNo}
                      </Link>
                    </TableCell>
                    <TableCell>{day(row.returnDate)}</TableCell>
                    <TableCell>{row.originBranch.name}</TableCell>
                    <TableCell>{row.destinationBranch.name}</TableCell>
                    <TableCell>{row.driver?.name ?? "-"}</TableCell>
                    <TableCell className="max-w-60 whitespace-normal [overflow-wrap:anywhere]">
                      {row.notes ?? "-"}
                    </TableCell>
                    <TableCell>{row.createdBy?.name ?? "-"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row._count.items}
                    </TableCell>
                    <TableCell>
                      <StatusText
                        value={row.status}
                        labels={POD_RETURN_STATUS}
                      />
                      {row.decidedBy && (
                        <span className="block text-xs text-muted-foreground">
                          {row.decidedBy.name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="min-w-48">
                      {approval &&
                      row.status === "PENDING" &&
                      canApprove &&
                      permitsBranch(actor, row.destinationBranchId) ? (
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
                          <input type="hidden" name="id" value={row.id} />
                        </ActionForm>
                      ) : (
                        <Link
                          href={`/pod-returns/${row.id}`}
                          className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
                        >
                          Detail
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            title={
              approval
                ? "Tidak ada POD Kembali yang menunggu"
                : "Belum ada POD Kembali"
            }
            description={
              approval
                ? "Dokumen yang dikirim ke cabang Anda akan tampil di sini. Ubah filter status untuk melihat yang sudah diputuskan."
                : "Buat dokumen lewat Tambah POD Kembali. Ubah filter untuk melihat dokumen lain."
            }
          />
        )}
      </section>
    </div>
  );
}
