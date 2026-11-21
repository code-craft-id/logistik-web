import "server-only";
import { cache } from "react";
import { isAdministrator } from "@/features/identity/permissions";
import { currentIdentity } from "@/features/identity/server/context";
import { FinanceField } from "./fields";

/** Active branches the current user may use; one query per request. */
// The database client loads lazily so page modules import without a DB.
const db = async () => (await import("@/lib/db")).prisma;

const financeBranches = cache(async () => {
  const current = await currentIdentity();
  if (!current) return [];
  const admin = isAdministrator(current.actor);
  return (await db()).branch.findMany({
    where: {
      deletedAt: null,
      status: "ACTIVE",
      ...(admin ? {} : { id: { in: current.actor.branchIds } }),
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
});

/** Branch and active account choices for client finance forms. */
export async function journalFormChoices() {
  const [branches, accounts] = await Promise.all([
    financeBranches(),
    (await db()).finAccount.findMany({
      where: { active: true, deletedAt: null },
      select: { id: true, code: true, name: true },
      orderBy: { code: "asc" },
      take: 500,
    }),
  ]);
  return {
    branches,
    accounts: accounts.map((a) => ({
      id: a.id,
      name: `${a.code} · ${a.name}`,
    })),
  };
}

/**
 * Searchable branch choice for finance forms and filters, replacing raw
 * branch-ID inputs. The finance services still re-check branch scope.
 */
export async function FinanceBranchField({
  prefix,
  value,
  optional = false,
}: {
  prefix: string;
  value?: string;
  optional?: boolean;
}) {
  return (
    <FinanceField
      prefix={prefix}
      name="branchId"
      label={optional ? "Cabang (opsional)" : "Cabang"}
      value={value}
      optional={optional}
      options={await financeBranches()}
    />
  );
}
