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
  INVALID_PARENT:
    "Data induk (misalnya kantor atau perusahaan) tidak ditemukan atau tidak aktif.",
  INVALID_REFERENCE: "Pilihan terkait tidak tersedia.",
  IN_USE: "Data masih digunakan oleh data lain.",
};
export class IdentityError extends Error {
  constructor(
    public code: string,
    public status: number,
    message = messages[code] ??
      "Permintaan tidak dapat diproses. Coba lagi; jika berulang, hubungi admin.",
  ) {
    super(message);
  }
}

/** Always reload group grants/membership; no long-lived authorization/session cache. */
export async function loadAccessActor(
  db: Prisma.TransactionClient,
  userId: number,
): Promise<AccessActor | null> {
  // One round trip (was four sequential Prisma relation queries); runs on every request.
  const [row] = await db.$queryRaw<
    {
      id: number;
      status: string;
      group_id: number | null;
      group_name: string | null;
      group_status: string | null;
      group_deleted_at: Date | null;
      permissions: { resource: string; action: string }[];
      branch_ids: number[];
    }[]
  >`
    SELECT u.id, u.status::text AS status,
           g.id AS group_id, g.name AS group_name,
           g.status::text AS group_status, g.deleted_at AS group_deleted_at,
           COALESCE((SELECT json_agg(json_build_object('resource', p.resource, 'action', p.action) ORDER BY p.id)
                     FROM permissions p WHERE p.group_id = g.id), '[]'::json) AS permissions,
           COALESCE((SELECT array_agg(ub.branch_id ORDER BY ub.id)
                     FROM user_allowed_branches ub
                     JOIN branches b ON b.id = ub.branch_id
                     JOIN offices o ON o.id = b.office_id
                     JOIN companies c ON c.id = o.company_id
                     WHERE ub.user_id = u.id
                       AND b.status = 'ACTIVE' AND b.deleted_at IS NULL
                       AND o.status = 'ACTIVE' AND o.deleted_at IS NULL
                       AND c.deleted_at IS NULL), '{}') AS branch_ids
    FROM auth_users u
    LEFT JOIN user_groups g ON g.id = u.group_id
    WHERE u.id = ${userId}`;
  if (!row) return null;
  return {
    id: row.id,
    status: row.status,
    group:
      row.group_id === null
        ? null
        : {
            id: row.group_id,
            name: row.group_name ?? "",
            status: row.group_status ?? "",
            deletedAt: row.group_deleted_at,
            permissions: row.permissions,
          },
    branchIds: row.branch_ids,
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
