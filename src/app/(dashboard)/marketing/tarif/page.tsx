import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
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
import { permits } from "@/features/identity/permissions";
import { currentIdentity } from "@/features/identity/server/context";
import { TariffImport } from "@/features/sales/components/tariff-import";
import {
  listCustomerTariffs,
  serviceName,
  tariffLabel,
  tariffPricing,
} from "@/features/sales/server/customer-tariffs";

export const metadata: Metadata = { title: "Tarif Customer" };

// Session-dependent page; blocking render.
export const instant = false;

const link =
  "inline-flex min-h-11 items-center text-primary underline underline-offset-4";
const money = (v: { toString(): string } | null) =>
  v === null ? "—" : Number(v.toString()).toLocaleString("id-ID");

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const actor = current.actor;
  if (!permits(actor, "view", "customer"))
    return (
      <EmptyState
        title="Akses ditolak"
        description="Anda belum memiliki hak lihat Customer."
      />
    );
  const query = await searchParams;
  const pricing = tariffPricing(query.pricing);
  const customerId = Number(query.customerId) || undefined;
  const { rows, lastUniqueNo } = await listCustomerTariffs(
    actor,
    pricing,
    customerId,
  );
  const href = (value: string) =>
    `/marketing/tarif?${new URLSearchParams({ pricing: value, ...(customerId ? { customerId: String(customerId) } : {}) })}`;
  const kg = pricing === "KG";
  const headers = [
    "Unique",
    "Customer",
    pricing === "TRUCKING" ? "Jenis Trucking" : "Service",
    "Moda",
    "Asal",
    "Tujuan",
    ...(kg
      ? ["Min Kg", "Tarif Pertama", "Tarif Selanjutnya"]
      : [pricing === "KOLI" ? "Tarif Koli" : "Tarif Trucking"]),
    "Lead Time (hari)",
  ];
  return (
    <div className="min-w-0 space-y-4 [overflow-wrap:anywhere]">
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
        Tarif Customer
      </h1>
      <div className="flex flex-wrap gap-4">
        <Link className={link} href="/marketing?tab=customer">
          Kembali ke Customer
        </Link>
        {customerId && (
          <Link className={link} href={`/marketing/tarif?pricing=${pricing}`}>
            Semua customer
          </Link>
        )}
      </div>
      <nav aria-label="Jenis tarif" className="flex gap-4 border-b">
        {(["KG", "KOLI", "TRUCKING"] as const).map((value) => (
          <Link
            key={value}
            href={href(value)}
            aria-current={value === pricing ? "page" : undefined}
            className="inline-flex min-h-11 items-center border-b-2 border-transparent px-1 text-sm aria-[current=page]:border-primary aria-[current=page]:font-semibold"
          >
            {tariffLabel[value]}
          </Link>
        ))}
      </nav>
      <div className="space-y-3 rounded-lg border bg-background p-4">
        <p className="text-sm">
          Nomor terakhir (kolom Unique): <strong>{lastUniqueNo}</strong>
        </p>
        <Button asChild variant="export" className="min-h-11">
          <a
            href={`/marketing/tarif/file?pricing=${pricing}&data=1${customerId ? `&customerId=${customerId}` : ""}`}
            download
          >
            Export Tarif
          </a>
        </Button>
        {permits(actor, "update", "customer") && (
          <TariffImport key={pricing} pricing={pricing} />
        )}
      </div>
      {rows.length ? (
        <section
          aria-label="Daftar tarif"
          // biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard scroll for the wide table.
          tabIndex={0}
          className="overflow-x-auto rounded-lg border bg-background"
        >
          <Table className="min-w-[56rem]">
            <TableHeader>
              <TableRow>
                {headers.map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.uniqueNo}</TableCell>
                  <TableCell>{row.customer.name}</TableCell>
                  <TableCell>{serviceName(row)}</TableCell>
                  <TableCell>{row.transportMode.name}</TableCell>
                  <TableCell>{row.originBranch.name}</TableCell>
                  <TableCell>{row.destinationBranch.name}</TableCell>
                  {kg && <TableCell>{money(row.minWeight)}</TableCell>}
                  <TableCell>{money(row.price)}</TableCell>
                  {kg && <TableCell>{money(row.nextPrice)}</TableCell>}
                  <TableCell>{row.leadTimeDays ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      ) : (
        <EmptyState
          title="Belum ada tarif"
          description="Tarif yang diimpor akan tampil di sini."
        />
      )}
    </div>
  );
}
