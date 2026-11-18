import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/patterns/content-state";
import { InfoTip } from "@/components/patterns/info-tip";
import { SelectAllCheckbox } from "@/components/patterns/select-all";
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
import { listManifests } from "@/features/shipments/server/manifests-queries";
import { requirePermission } from "@/lib/auth/session";

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
  await requirePermission("view", "manifest");
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const query = await searchParams;
  const one = (v: string | string[] | undefined) =>
    typeof v === "string" ? v : undefined;
  const search = one(query.search) ?? "";
  const type = one(query.type) ?? "";
  const titles: Record<string, string> = {
    Transit: "Cek Transit",
    Inbound: "Cek Inbound",
    Outbound: "Manifest Outbound",
  };
  const page = Number(one(query.page) ?? 1) || 1;
  const result = await listManifests(current.actor, { page, search, type });
  const href = (p: number) =>
    `/manifest?${new URLSearchParams({ ...(type ? { type } : {}), ...(search ? { search } : {}), page: String(p) })}`;
  const headers = [
    "Manifes No.",
    "Tanggal",
    "Asal",
    "Tujuan",
    "Tot. AWB",
    "Tot. Koli",
    "Tot. Berat (kg)",
    "Tot. Volume",
    "Kendaraan",
    "Kurir",
    "Status",
  ];
  const numeric = new Set(headers.filter((h) => h.startsWith("Tot.")));
  return (
    <div className="min-w-0 space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {titles[type] ?? "Daftar Manifest"}
            </h1>
            <InfoTip
              text={
                "Manifest dalam cakupan cabang Anda. Total dihitung dari AWB yang masih aktif di manifest."
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
      <Form
        action="/manifest"
        className="flex flex-col gap-2 rounded-lg border bg-background p-4 sm:flex-row sm:items-end"
      >
        {type && <input type="hidden" name="type" value={type} />}
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
              <Table className="min-w-[64rem]">
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
