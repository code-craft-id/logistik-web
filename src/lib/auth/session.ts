import "server-only";
import {
  activeActor,
  permits,
  permitsBranch,
} from "@/features/identity/permissions";
import {
  assertPermission,
  IdentityError,
} from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";
import { prisma } from "@/lib/db";

export async function getServerSession() {
  return (await currentIdentity())?.session ?? null;
}
export async function getCurrentUser() {
  return (await getServerSession())?.user ?? null;
}
export async function getCurrentUserWithRelations() {
  const current = await currentIdentity();
  if (!current) return null;
  return prisma.user.findUnique({
    where: { id: current.actor.id },
    include: {
      group: true,
      allowedBranches: {
        where: { branchId: { in: current.actor.branchIds } },
        include: { branch: true },
      },
    },
  });
}
/** Explicit assigned branches only; [] is never a global/HQ privilege. */
export async function getUserBranchScope() {
  return (await currentIdentity())?.actor.branchIds ?? [];
}
export async function canAccessBranch(branchId: number) {
  return permitsBranch((await currentIdentity())?.actor ?? null, branchId);
}
export async function getUserGroup() {
  return (await currentIdentity())?.actor.group ?? null;
}
export async function hasPermission(action: string, resource: string) {
  return permits((await currentIdentity())?.actor ?? null, action, resource);
}
export async function hasAnyPermission(
  requested: Array<{ action: string; resource: string }>,
) {
  const actor = (await currentIdentity())?.actor ?? null;
  return requested.some(({ action, resource }) =>
    permits(actor, action, resource),
  );
}
export async function requireAuth() {
  const current = await currentIdentity();
  if (!current || !activeActor(current.actor))
    throw new IdentityError("UNAUTHENTICATED", 401);
  return current.session.user;
}
export async function requirePermission(action: string, resource: string) {
  const current = await currentIdentity();
  if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
  assertPermission(current.actor, action, resource);
  return current.session.user;
}
export async function requireBranchAccess(branchId: number) {
  const user = await requireAuth();
  if (!(await canAccessBranch(branchId)))
    throw new IdentityError("FORBIDDEN_BRANCH", 403);
  return user;
}
