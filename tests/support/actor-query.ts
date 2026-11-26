import type { Mock } from "vitest";

type FoundUser = {
  id: number;
  status: string;
  group: {
    id: number;
    name: string;
    status: string;
    deletedAt: Date | null;
    permissions: { resource: string; action: string }[];
  } | null;
  allowedBranches?: { branchId: number }[];
} | null;

/**
 * loadAccessActor reads the actor with one $queryRaw. Unit tests keep mocking
 * `user.findUnique`; this serves that single query from the same mock and
 * sends every other raw query to `fallback`.
 */
export function serveActorQuery(
  db: { user: { findUnique: Mock }; $queryRaw: Mock },
  fallback: (...args: unknown[]) => unknown = async () => [],
) {
  db.$queryRaw.mockImplementation(
    async (strings: TemplateStringsArray, ...values: unknown[]) => {
      if (!strings.join("").includes("FROM auth_users u"))
        return fallback(strings, ...values);
      const user = (await db.user.findUnique({
        where: { id: values[0] },
      })) as FoundUser;
      if (!user) return [];
      return [
        {
          id: user.id,
          status: user.status,
          group_id: user.group?.id ?? null,
          group_name: user.group?.name ?? null,
          group_status: user.group?.status ?? null,
          group_deleted_at: user.group?.deletedAt ?? null,
          permissions: user.group?.permissions ?? [],
          branch_ids: (user.allowedBranches ?? []).map((b) => b.branchId),
        },
      ];
    },
  );
}
