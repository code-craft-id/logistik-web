import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { PrintButton } from "@/components/patterns/print-button";
import { currentIdentity } from "@/features/identity/server/context";
import { getManifest } from "@/features/shipments/server/manifests-queries";
import { requirePermission } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Print Manifest" };

// Session-dependent page; blocking render.
export const instant = false;

const outcomeLabel: Record<string, string> = {
  DELIVERED: "Terkirim",
  FAILED_DELIVERY: "Gagal",
  RETURNED: "Retur",
};

/** Print Manifest, or Print DRS with ?doc=drs (adds receiver signature). */
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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
  const drs = (await searchParams).doc === "drs";
  if (drs && !manifest.deliverySheet) notFound();
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/manifest/${manifest.id}`}
          className="inline-flex min-h-11 items-center text-sm text-primary underline underline-offset-4"
        >
          Kembali ke detail manifest
        </Link>
        <PrintButton label={drs ? "Cetak DRS" : "Cetak Manifest"} />
      </div>
      <article className="space-y-4 rounded-lg border bg-background p-6 print:border-0 print:p-0">
        <header className="space-y-1 border-b pb-4">
          <h1 className="text-xl font-semibold">
            {drs
              ? `Lembar Pengantaran ${manifest.deliverySheet?.sheetNo}`
              : `Manifest ${manifest.manifestNo}`}
          </h1>
          <p className="text-sm">
            {drs
              ? `Tanggal antar ${manifest.deliverySheet?.date} · Manifest ${manifest.manifestNo}`
              : `Tanggal ${manifest.date} · ${manifest.origin ?? "-"} → ${manifest.destination ?? "-"}`}
          </p>
          <p className="text-sm">
            Kendaraan {manifest.vehicle ?? "-"} · Kurir{" "}
            {manifest.courier ?? "-"}
            {manifest.vendor ? ` · Vendor ${manifest.vendor}` : ""}
          </p>
        </header>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-1 pr-2">No.</th>
              <th className="py-1 pr-2">AWB No.</th>
              <th className="py-1 pr-2">Penerima</th>
              <th className="py-1 pr-2">Tujuan</th>
              <th className="py-1 pr-2 text-right">Koli</th>
              <th className="py-1 pr-2 text-right">Berat</th>
              {drs && <th className="py-1 pr-2">Hasil / TTD penerima</th>}
            </tr>
          </thead>
          <tbody>
            {manifest.items.map((item, index) => (
              <tr key={item.id} className="border-b align-top">
                <td className="py-2 pr-2">{index + 1}</td>
                <td className="py-2 pr-2">{item.awbNo ?? "-"}</td>
                <td className="py-2 pr-2">{item.receiver ?? "-"}</td>
                <td className="py-2 pr-2">{item.destination ?? "-"}</td>
                <td className="py-2 pr-2 text-right">{item.koli ?? "-"}</td>
                <td className="py-2 pr-2 text-right">{item.kilo ?? "-"}</td>
                {drs && (
                  <td className="py-2 pr-2">
                    {item.outcome
                      ? (outcomeLabel[item.outcome] ?? item.outcome)
                      : ""}
                    <span className="mt-6 block border-b" />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold">
              <td className="py-2 pr-2" colSpan={4}>
                Total {manifest.awb} AWB
              </td>
              <td className="py-2 pr-2 text-right">{manifest.koli ?? "-"}</td>
              <td className="py-2 pr-2 text-right">{manifest.kilo ?? "-"}</td>
              {drs && <td />}
            </tr>
          </tfoot>
        </table>
        <footer className="grid grid-cols-2 gap-6 pt-8 text-center text-sm">
          <p className="border-t pt-2">{drs ? "Kurir" : "Petugas gudang"}</p>
          <p className="border-t pt-2">{drs ? "Admin" : "Pengemudi"}</p>
        </footer>
      </article>
    </div>
  );
}
