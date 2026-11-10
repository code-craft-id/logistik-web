import { isAdministrator } from "@/features/identity/permissions";
import { currentIdentity } from "@/features/identity/server/context";
import { identityResponse } from "@/features/identity/server/http";
import { prisma } from "@/lib/db";

export async function GET() {
  return identityResponse(async () => {
    const current = await currentIdentity();
    if (!current) {
      return { branches: [], isAdmin: false };
    }
    const actor = current.actor;
    const isAdmin = isAdministrator(actor);
    if (isAdmin) {
      const branches = await prisma.branch.findMany({
        where: { deletedAt: null },
        orderBy: [{ code: "asc" }, { name: "asc" }],
        select: { id: true, code: true, name: true },
      });
      return { branches, isAdmin: true };
    }
    const branchIds = actor.branchIds || [];
    if (branchIds.length === 0) {
      return { branches: [], isAdmin: false };
    }
    const branches = await prisma.branch.findMany({
      where: { id: { in: branchIds }, deletedAt: null },
      orderBy: [{ code: "asc" }, { name: "asc" }],
      select: { id: true, code: true, name: true },
    });
    return { branches, isAdmin: false };
  });
}
