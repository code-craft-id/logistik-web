import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/patterns/content-state";
import { InfoTip } from "@/components/patterns/info-tip";
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
import { permits } from "@/features/identity/permissions";
import { currentIdentity } from "@/features/identity/server/context";
import { customerRevenue } from "@/features/sales/server/revenue";
import { businessDateString } from "@/lib/date/business-date";
import { formatRupiah } from "@/lib/format/rupiah";

export const metadata: Metadata = { title: "Pendapatan Pelanggan" };

// Session-dependent page; blocking render.
export const instant = false;

const rupiah = (value: string) => formatRupiah(value, { prefix: false });

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const current = await currentIdentity();
  if (!current) redirect("/login");
  if (!permits(current.actor, "view", "customer"))
    return (
      <EmptyState
        title="Akses ditolak"
        description="Grup Anda belum memiliki hak lihat Customer. Minta admin menambahkan hak tersebut."
      />
    );
  const query = await searchParams;
  const one = (v: string | string[] | undefined) =>
    typeof v === "string" ? v : "";
  const thisMonth = businessDateString().slice(0, 7);
  const requested = one(query.month);
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(requested)
    ? requested
    : thisMonth;
  const search = one(query.search).slice(0, 100);
  const rows = await customerRevenue(current.actor, month, search);
  return (
    <div className="min-w-0 space-y-5 [overflow-wrap:anywhere]">
      <header className="space-y-1">
        <div className="flex items-center gap-1">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Pemasaran/Penjualan
          </h1>
          <InfoTip
            text={
              "Pendapatan = total biaya AWB customer pada bulan terpilih berdasarkan waktu Asia/Jakarta. Growth dibandingkan dengan bulan sebelumnya."
            }
          />
        </div>
      </header>
      <nav aria-label="Jenis data" className="flex gap-4 border-b">
        {[
          ["/marketing?tab=customer", "Customer", false],
          ["/marketing?tab=consignee", "Penerima", false],
          ["/marketing/revenue", "Pendapatan Pelanggan", true],
        ].map(([href, label, active]) => (
          <Link
            key={String(href)}
            href={String(href)}
            aria-current={active ? "page" : undefined}
            className="inline-flex min-h-11 items-center border-b-2 border-transparent px-1 text-sm aria-[current=page]:border-primary aria-[current=page]:font-semibold"
          >
            {label}
          </Link>
        ))}
      </nav>
      <Form
        action="/marketing/revenue"
        className="grid items-end gap-4 rounded-lg border bg-background p-4 sm:grid-cols-[12rem_1fr_auto]"
      >
        <div className="min-w-0 space-y-2">
          <Label htmlFor="revenue-month">Bulan</Label>
          <Input
            id="revenue-month"
            name="month"
            type="month"
            defaultValue={month}
            className="min-h-11"
          />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="revenue-search">Cari pelanggan</Label>
          <Input
            id="revenue-search"
            name="search"
            maxLength={100}
            defaultValue={search}
            className="min-h-11"
          />
        </div>
        <Button type="submit" className="min-h-11">
          Tampilkan
        </Button>
      </Form>
      <section
        aria-label="Daftar pendapatan pelanggan"
        className="min-w-0 rounded-lg border bg-background"
      >
        {rows.length ? (
          <div className="overflow-x-auto">
            <Table className="min-w-[36rem]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No.</TableHead>
                  <TableHead>List Pelanggan</TableHead>
                  <TableHead className="text-right">
                    Total Pendapatan (Rp)
                  </TableHead>
                  <TableHead className="text-right">Growth</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell className="tabular-nums">{index + 1}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {rupiah(row.revenue)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className="block">{row.growth ?? "-"}</span>
                      <span className="block text-xs text-muted-foreground">
                        dari {rupiah(row.previous)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            title={
              search ? "Tidak ada pelanggan yang cocok" : "Belum ada pelanggan"
            }
            description={
              search
                ? "Ubah kata pencarian atau kosongkan untuk melihat semua pelanggan."
                : "Tambahkan customer di tab Customer terlebih dahulu."
            }
          />
        )}
      </section>
    </div>
  );
}
