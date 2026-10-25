import "server-only";
import { redirect } from "next/navigation";
import { cloneElement, type ReactElement } from "react";
import { EmptyState } from "@/components/patterns/content-state";
import {
  type IdentityCapabilities,
  isAdministrator,
  permits,
} from "../permissions";
import { currentIdentity } from "../server/context";

export async function IdentityAccess({
  resource,
  children,
}: {
  resource: string;
  children: ReactElement<{ capabilities?: IdentityCapabilities }>;
}) {
  const current = await currentIdentity();
  if (!current) redirect("/login");
  if (!permits(current.actor, "view", resource)) {
    return (
      <EmptyState
        title="Akses ditolak"
        description="Grup Anda belum diberi izin untuk membuka halaman ini. Hubungi administrator."
      />
    );
  }
  return cloneElement(children, {
    capabilities: {
      create: permits(current.actor, "create", resource),
      update: permits(current.actor, "update", resource),
      delete: permits(current.actor, "delete", resource),
      administrator: isAdministrator(current.actor),
    },
  });
}
