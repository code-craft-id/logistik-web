import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { InfoTip } from "@/components/patterns/info-tip";
import { currentIdentity } from "@/features/identity/server/context";
import { ManifestCreateForm } from "@/features/shipments/components/manifest-forms";
import { manifestFormOptions } from "@/features/shipments/server/manifests-queries";
import { requirePagePermission } from "@/lib/auth/page-access";

export const metadata: Metadata = { title: "Tambah Manifest" };

// Session-dependent page; blocking render like the Dev 2 transaction detail.
export const instant = false;

export default async function Page() {
  await requirePagePermission("create", "manifest");
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const options = await manifestFormOptions(current.actor);
  return (
    <div className="min-w-0 space-y-5">
      <header className="space-y-1">
        <Link
          href="/manifest"
          className="inline-flex min-h-11 items-center text-sm text-primary underline underline-offset-4"
        >
          Kembali ke daftar manifest
        </Link>
        <div className="flex items-center gap-1">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Tambah Manifest
          </h1>
          <InfoTip
            text={
              "Manifest dibuat berstatus Draft. Tambahkan AWB dari halaman detail setelah disimpan."
            }
          />
        </div>
      </header>
      <ManifestCreateForm
        {...options}
        today={new Date().toISOString().slice(0, 10)}
      />
    </div>
  );
}
