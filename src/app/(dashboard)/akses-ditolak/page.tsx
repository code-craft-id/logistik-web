import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/patterns/content-state";
import { Button } from "@/components/ui/button";
import { permissionResources } from "@/features/identity/permissions";

export const metadata: Metadata = { title: "Akses ditolak" };

const ACTIONS: Record<string, string> = {
  view: "lihat",
  create: "tambah",
  update: "ubah",
  delete: "hapus",
  approve: "setujui",
  export: "ekspor",
  request: "ajukan",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const resource = typeof query.resource === "string" ? query.resource : "";
  const action = typeof query.action === "string" ? query.action : "";
  // Only known names are echoed back; anything else is ignored.
  const entry = permissionResources.find((r) => r.resource === resource);
  const right =
    entry && (entry.actions as readonly string[]).includes(action)
      ? `hak "${ACTIONS[action] ?? action}" pada "${entry.label}"`
      : null;
  return (
    <EmptyState
      title="Akses ditolak"
      description={
        right
          ? `Grup Anda belum memiliki ${right}. Minta admin menambahkan hak tersebut di Hak Akses Menu.`
          : "Grup Anda belum memiliki hak untuk membuka halaman ini. Minta admin menambahkan hak tersebut."
      }
      action={
        <Button asChild variant="outline" className="min-h-11">
          <Link href="/dashboard">Kembali ke Dashboard</Link>
        </Button>
      }
    />
  );
}
