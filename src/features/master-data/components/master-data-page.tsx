import "server-only";
import { redirect } from "next/navigation";
import { isAdministrator, permits } from "@/features/identity/permissions";
import { currentIdentity } from "@/features/identity/server/context";
import { type MasterKind, masterForms } from "../contracts";
import { MasterDataWorkspace } from "./master-data-workspace";
export async function MasterDataPage({
  kinds,
  title,
}: {
  kinds: MasterKind[];
  title: string;
}) {
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const allowed = kinds.filter((kind) => permits(current.actor, "view", kind));
  if (!allowed.length)
    return (
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p>Akses ditolak. Hubungi administrator untuk hak akses halaman ini.</p>
      </section>
    );
  const capabilities = Object.fromEntries(
    allowed.map((kind) => [
      kind,
      Object.fromEntries(
        ["create", "update", "delete"].map((action) => [
          action,
          permits(current.actor, action, kind) &&
            (masterForms[kind].scoped || isAdministrator(current.actor)),
        ]),
      ),
    ]),
  );
  return (
    <MasterDataWorkspace
      title={title}
      kinds={allowed}
      capabilities={capabilities}
    />
  );
}
