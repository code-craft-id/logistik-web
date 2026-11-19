import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/patterns/content-state";
import { InfoTip } from "@/components/patterns/info-tip";
import { PageTabs } from "@/components/patterns/page-tabs";
import { SelectAllCheckbox } from "@/components/patterns/select-all";
import { Button } from "@/components/ui/button";
import { ComboSelect } from "@/components/ui/combo-select";
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
import { selectClass } from "@/features/modul/components/page-bits";
import { branchChoices } from "@/features/modul/server/inbound";
import { listManifests } from "@/features/shipments/server/manifests-queries";
import { requirePagePermission } from "@/lib/auth/page-access";

export const metadata: Metadata = { title: "Daftar Manifest" };

// Session-dependent page; blocking render like the Dev 2 transaction detail.
export const instant = false;

const link =
  "inline-flex min-h-11 items-center text-primary underline underline-offset-4";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePagePermission("view", "manifest");
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const query = await searchParams;
  const one = (v: string | string[] | undefined) =>
    typeof v === "string" ? v : undefined;
  const search = one(query.search) ?? "";
  const agent = one(query.view) === "agent";
  const type = agent ? "" : (one(query.type) ?? "");
  const destination = Number(one(query.destination)) || undefined;
  const titles: Record<string, string> = {
    Transit: "Cek Transit",
    Inbound: "Cek Inbound",
    Outbound: "Manifest Outbound",
  };
  const page = Number(one(query.page) ?? 1) || 1;
  const [result, branches] = await Promise.all([
    listManifests(current.actor, { page, search, type, agent, destination }),
    branchChoices(),
  ]);
  const keep = {
    ...(agent ? { view: "agent" } : {}),
    ...(type ? { type } : {}),
    ...(search ? { search } : {}),
    ...(destination ? { destination: String(destination) } : {}),
  };
  const href = (p: number) =>
    `/manifest?${new URLSearchParams({ ...keep, page: String(p) })}`;
  const activeTab = agent ? "agent" : type || "all";
  const tabs = [
    { key: "all", label: "Semua", href: "/manifest" },
    { key: "Outbound", label: "Outbound", href: "/manifest?type=Outbound" },
    { key: "Transit", label: "Transit", href: "/manifest?type=Transit" },
    { key: "Inbound", label: "Inbound", href: "/manifest?type=Inbound" },
    { key: "agent", label: "Inbound Agen", href: "/manifest?view=agent" },
  ];
  // Provider Cek Transit shows Transit1..5; Cek Inbound one Transit column.
  const transitHeaders =
    type === "Transit"
      ? ["Transit1", "Transit2", "Transit3", "Transit4", "Transit5"]
      : type === "Inbound"
        ? ["Transit"]
        : [];
  const headers = [
    "Manifes No.",
    "Tanggal",
    "Asal",
    ...transitHeaders,
    "Tujuan",
    "Tot. AWB",
    "Tot. Koli",
    "Tot. Berat (kg)",
    "Tot. Volume",
    "Kendaraan",
    "Driver",
    ...(agent ? ["Agen / Vendor"] : []),
    "Status",
  ];
  const numeric = new Set(headers.filter((h) => h.startsWith("Tot.")));
  return (
    <div className="min-w-0 space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {agent ? "Cek Inbound Agen" : (titles[type] ?? "Daftar Manifest")}
            </h1>
            <InfoTip
              text={
                agent
                  ? "Manifest yang diteruskan ke agen/vendor. Pilih Tujuan untuk melihat manifest ke kota tertentu. Total dihitung dari AWB yang masih aktif."
                  : "Manifest dalam cakupan cabang Anda; tab Inbound juga menampilkan manifest yang menuju cabang Anda. Total dihitung dari AWB yang masih aktif di manifest."
              }
            />
          </div>
        </div>
        {permits(current.actor, "create", "manifest") && (
          <Button asChild className="min-h-11">
            <Link href="/manifest/new">Tambah Manifest</Link>
          </Button>
        )}
      </header>
      <PageTabs label="Jenis manifest" tabs={tabs} active={activeTab} />
      <Form
        action="/manifest"
        className="flex flex-col gap-2 rounded-lg border bg-background p-4 sm:flex-row sm:items-end"
      >
        {type && <input type="hidden" name="type" value={type} />}
        {agent && <input type="hidden" name="view" value="agent" />}
        <div className="min-w-0 space-y-2 sm:w-64">
          <label htmlFor="manifest-destination" className="text-sm font-medium">
            Tujuan
          </label>
          <ComboSelect
            id="manifest-destination"
            name="destination"
            defaultValue={destination ? String(destination) : ""}
            className={selectClass}
          >
            <option value="">Semua tujuan</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </ComboSelect>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <label htmlFor="manifest-search" className="text-sm font-medium">
            Cari nomor manifest
          </label>
          <Input
            id="manifest-search"
            name="search"
            maxLength={50}
            defaultValue={search}
            className="min-h-11"
          />
        </div>
        <Button type="submit" variant="outline" className="min-h-11">
          Cari
        </Button>
      </Form>
      <section
        aria-label="Daftar manifest"
        className="min-w-0 rounded-lg border bg-background"
      >
        {result.items.length ? (
          <form
            action="/print/manifests"
            method="get"
            target="_blank"
            rel="noopener"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-3">
              <SelectAllCheckbox name="ids" />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" className="min-h-11">
                  Print terpilih
                </Button>
                <Button
                  type="submit"
                  name="doc"
                  value="drs"
                  variant="outline"
                  className="min-h-11"
                >
                  Print DRS terpilih
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table
                className={
                  type === "Transit" ? "min-w-[88rem]" : "min-w-[64rem]"
                }
              >
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <span className="sr-only">Pilih</span>
                    </TableHead>
                    <TableHead className="w-12">No.</TableHead>
                    {headers.map((h) => (
                      <TableHead
                        key={h}
                        className={numeric.has(h) ? "text-right" : undefined}
                      >
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.items.map((row, index) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          name="ids"
                          value={row.id}
                          aria-label={`Pilih manifest ${row.manifestNo}`}
                          className="size-4"
                        />
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {(result.page - 1) * 25 + index + 1}
                      </TableCell>
                      <TableCell>
                        <Link className={link} href={`/manifest/${row.id}`}>
                          {row.manifestNo}
                        </Link>
                      </TableCell>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{row.origin ?? "—"}</TableCell>
                      {type === "Transit" &&
                        row.transits.map((t, i) => (
                          // biome-ignore lint/suspicious/noArrayIndexKey: fixed Transit1..5 positions
                          <TableCell key={i}>{t || "-"}</TableCell>
                        ))}
                      {type === "Inbound" && (
                        <TableCell>
                          {row.transits.filter(Boolean).join(" → ") || "-"}
                        </TableCell>
                      )}
                      <TableCell>{row.destination ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.awb}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.koli ?? "Tidak tersedia"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.kilo ?? "Tidak tersedia"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.volume ?? "Tidak tersedia"}
                      </TableCell>
                      <TableCell>{row.vehicle ?? "—"}</TableCell>
                      <TableCell>{row.courier ?? "—"}</TableCell>
                      {agent && <TableCell>{row.vendor ?? "—"}</TableCell>}
                      <TableCell>{row.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </form>
        ) : (
          <EmptyState
            title={
              search ? "Tidak ada manifest yang cocok" : "Belum ada manifest"
            }
            description={
              search
                ? "Ubah kata pencarian atau kosongkan untuk melihat semua manifest."
                : "Manifest yang dibuat akan tampil di sini."
            }
          />
        )}
      </section>
      <nav
        aria-label="Halaman manifest"
        className="flex flex-wrap items-center gap-4 text-sm"
      >
        <span>
          {result.total} manifest · halaman {result.page} dari {result.pages}
        </span>
        {result.page > 1 && (
          <Link className={link} href={href(result.page - 1)}>
            Sebelumnya
          </Link>
        )}
        {result.page < result.pages && (
          <Link className={link} href={href(result.page + 1)}>
            Berikutnya
          </Link>
        )}
      </nav>
    </div>
  );
}
