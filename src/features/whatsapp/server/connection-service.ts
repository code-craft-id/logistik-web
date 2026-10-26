import "server-only";
import {
  type AccessActor,
  isAdministrator,
} from "@/features/identity/permissions";
import {
  assertPermission,
  IdentityError,
} from "@/features/identity/server/access";
import type { PrismaClient } from "@/lib/db/generated/client";
import { whatsappBranchId } from "../contracts";
import { createWhatsAppGateway } from "./gateway";

export function createWhatsAppConnectionService(
  db: PrismaClient,
  resolveActor: () => Promise<AccessActor | null>,
  gateway = createWhatsAppGateway(),
) {
  async function authorize(input: unknown, manage: boolean) {
    const current = await resolveActor();
    assertPermission(
      current,
      manage ? "update" : "view",
      "whatsapp_configuration",
    );
    if (manage && !isAdministrator(current))
      throw new IdentityError("FORBIDDEN", 403);
    const branchId = whatsappBranchId.parse(input);
    const branch = await db.branch.findFirst({
      where: {
        id: branchId,
        deletedAt: null,
        status: "ACTIVE",
        ...(!isAdministrator(current)
          ? { AND: [{ id: { in: current.branchIds } }] }
          : {}),
        office: {
          deletedAt: null,
          status: "ACTIVE",
          company: { deletedAt: null },
        },
      },
      select: { id: true },
    });
    if (!branch) throw new IdentityError("NOT_FOUND", 404);
    return { current, branchId };
  }
  return {
    async status(input: unknown) {
      const { branchId } = await authorize(input, false);
      return gateway.session(branchId);
    },
    async qr(input: unknown) {
      const { branchId, current } = await authorize(input, true);
      await db.identityAuditEvent.create({
        data: {
          actorId: current.id,
          action: "WHATSAPP_QR_REQUESTED",
          subjectType: "branch_whatsapp",
          subjectId: branchId,
        },
      });
      const result = await gateway.qr(branchId);
      const latest = await authorize(input, true);
      if (latest.current.id !== current.id)
        throw new IdentityError("UNAUTHENTICATED", 401);
      return result;
    },
    async change(input: unknown, method: "POST" | "DELETE") {
      const { branchId, current } = await authorize(input, true);
      const action =
        method === "POST" ? "WHATSAPP_CONNECT" : "WHATSAPP_DISCONNECT";
      // Durable attempt before the external side effect; the gateway operation is idempotent per branch.
      await db.identityAuditEvent.create({
        data: {
          actorId: current.id,
          action: `${action}_REQUESTED`,
          subjectType: "branch_whatsapp",
          subjectId: branchId,
        },
      });
      await authorize(input, true);
      try {
        const result = await gateway.session(branchId, method);
        await db.identityAuditEvent.create({
          data: {
            actorId: current.id,
            action: `${action}_COMPLETED`,
            subjectType: "branch_whatsapp",
            subjectId: branchId,
          },
        });
        return result;
      } catch (error) {
        await db.identityAuditEvent.create({
          data: {
            actorId: current.id,
            action: `${action}_UNCONFIRMED`,
            subjectType: "branch_whatsapp",
            subjectId: branchId,
          },
        });
        throw error;
      }
    },
  };
}
