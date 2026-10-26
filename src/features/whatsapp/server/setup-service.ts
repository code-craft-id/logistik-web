import "server-only";
import {
  type AccessActor,
  isAdministrator,
} from "@/features/identity/permissions";
import { assertPermission } from "@/features/identity/server/access";
import type { Prisma, PrismaClient } from "@/lib/db/generated/client";
import { type BranchWhatsAppSetup, branchSetupQuery } from "../contracts";
import { readWhatsAppGatewayConfig } from "./config";

export function createWhatsAppSetupService(
  db: PrismaClient,
  resolveActor: () => Promise<AccessActor | null>,
  readConfig = readWhatsAppGatewayConfig,
) {
  return {
    async list(input: unknown = {}): Promise<BranchWhatsAppSetup> {
      const current = await resolveActor();
      assertPermission(current, "view", "whatsapp_configuration");
      const { companyId, page, pageSize, search } =
        branchSetupQuery.parse(input);
      const administrator = isAdministrator(current);
      const gatewayConfiguration = readConfig().state;
      const where: Prisma.BranchWhereInput = {
        deletedAt: null,
        status: "ACTIVE",
        ...(!administrator ? { id: { in: current.branchIds } } : {}),
        office: {
          status: "ACTIVE",
          deletedAt: null,
          company: { deletedAt: null },
          ...(companyId ? { companyId } : {}),
        },
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { code: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      };
      const [rows, total] = await Promise.all([
        db.branch.findMany({
          where,
          select: {
            id: true,
            code: true,
            name: true,
            office: { select: { name: true } },
          },
          orderBy: [{ code: "asc" }, { id: "asc" }],
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        db.branch.count({ where }),
      ]);
      return {
        items: rows.map(({ office, ...branch }) => ({
          ...branch,
          officeName: office.name,
        })),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
        connectionAvailable: gatewayConfiguration === "configured",
        canManageConnections: administrator,
        gatewayConfiguration: administrator ? gatewayConfiguration : null,
      };
    },
  };
}
