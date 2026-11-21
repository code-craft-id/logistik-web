import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PrintToolbar } from "@/components/patterns/auto-print";
import { currentIdentity } from "@/features/identity/server/context";
import { ManifestDocument } from "@/features/shipments/components/manifest-document";
import { getManifest } from "@/features/shipments/server/manifests-queries";
import { requirePagePermission } from "@/lib/auth/page-access";

export const metadata: Metadata = { title: "Print Manifest" };

// Session-dependent document; blocking render.
export const instant = false;

const MAX = 50;

/** Print Manifest (or DRS with doc=drs) for ?ids=1&ids=2, one page each. */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePagePermission("view", "manifest");
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const query = await searchParams;
  const drs = query.doc === "drs";
  const raw = query.ids;
  const ids = [
    ...new Set(
      (Array.isArray(raw) ? raw : (raw ?? "").split(","))
        .map(Number)
        .filter((n) => Number.isSafeInteger(n) && n > 0),
    ),
  ].slice(0, MAX);
  const manifests = (
    await Promise.all(ids.map((id) => getManifest(current.actor, id)))
  ).filter(
    (m): m is NonNullable<typeof m> => !!m && (!drs || !!m.deliverySheet),
  );
  if (!manifests.length)
    return (
      <p className="p-8 text-sm">
        Tidak ada {drs ? "DRS" : "manifest"} yang bisa dicetak. Pilih dari
        daftar Manifest lalu klik Print terpilih. Hanya manifest cabang Anda
        {drs ? " yang sudah punya DRS" : ""} yang bisa dicetak.
      </p>
    );
  return (
    <>
      <PrintToolbar
        label={drs ? "Cetak DRS" : "Cetak Manifest"}
        count={manifests.length}
      />
      <main className="space-y-6 p-4 print:space-y-0 print:p-0">
        {manifests.map((manifest) => (
          <ManifestDocument key={manifest.id} manifest={manifest} drs={drs} />
        ))}
      </main>
    </>
  );
}
