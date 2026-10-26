import "server-only";
import type { Prisma } from "@/lib/db/generated/client";
import {
  type AccessActor,
  activeActor,
  isAdministrator,
  permits,
} from "../permissions";

const messages: Record<string, string> = {
  UNAUTHENTICATED: "Silakan masuk kembali.",
  FORBIDDEN: "Anda tidak memiliki hak akses ini.",
  FORBIDDEN_BRANCH: "Cabang berada di luar cakupan Anda.",
  NOT_FOUND: "Data tidak ditemukan.",
  CONFLICT: "Data telah berubah. Muat data terbaru dan coba kembali.",
  INVALID_PARENT: "Induk data tidak tersedia.",
  INVALID_REFERENCE: "Pilihan terkait tidak tersedia.",
  IN_USE: "Data masih digunakan oleh data lain.",
};
export class IdentityError extends Error {
  constructor(
    public code: string,
    public status: number,
    message = messages[code] ?? "Permintaan tidak dapat diproses.",
  ) {
    super(message);
  }
}

/** Always reload group grants/membership; no long-lived authorization/session cache. */
export async function loadAccessActor(
  db: Prisma.TransactionClient,
  userId: number,
): Promise<AccessActor | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      status: true,
      group: {
        select: {
          id: true,
          name: true,
          status: true,
          deletedAt: true,
          permissions: { select: { resource: true, action: true } },
        },
      },
      allowedBranches: {
        where: {
          branch: {
            status: "ACTIVE",
            deletedAt: null,
            office: {
              status: "ACTIVE",
              deletedAt: null,
              company: { deletedAt: null },
            },
          },
        },
        select: { branchId: true },
      },
    },
  });
  if (!user) return null;
  return {
    id: user.id,
    status: user.status,
    group: user.group,
    branchIds: user.allowedBranches.map((entry) => entry.branchId),
  };
}

export function assertPermission(
  actor: AccessActor | null,
  action: string,
  resource: string,
): asserts actor is AccessActor {
  if (!activeActor(actor))
    throw new IdentityError("UNAUTHENTICATED", 401, "Silakan masuk kembali.");
  if (!permits(actor, action, resource))
    throw new IdentityError(
      "FORBIDDEN",
      403,
      "Anda tidak memiliki hak akses ini.",
    );
}

/** Lists and direct record lookups use the same bounded branch predicate. */
export function visibleUsers(actor: AccessActor): Prisma.UserWhereInput {
  if (isAdministrator(actor)) return {};
  return {
    allowedBranches: {
      some: { branchId: { in: actor.branchIds } },
      every: { branchId: { in: actor.branchIds } },
    },
    group: {
      is: {
        permissions: { none: { resource: "system_admin", action: "manage" } },
      },
    },
  };
}
