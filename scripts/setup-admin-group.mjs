import "dotenv/config";
import { localDatabaseUrl } from "../prisma/local-database.mjs";

/** Explicit local bootstrap only. Never called by app startup or general fake seeds. */
async function main() {
  const connectionString = localDatabaseUrl(process.env.DATABASE_URL, {
    purpose: "seed",
    nodeEnv: process.env.NODE_ENV,
  });
  const [{ PrismaClient }, { PrismaPg }] = await Promise.all([
    import("../src/lib/db/generated/client.ts"),
    import("@prisma/adapter-pg"),
  ]);
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(71642, 1)`;
      const user = await tx.user.findUnique({
        where: { username: "admin" },
        select: { id: true, email: true, groupId: true },
      });
      if (!user || user.email !== "admin@logistik.local")
        throw new Error("Dedicated local identity is missing or mismatched.");
      if (user.groupId !== null) {
        console.log(
          "Existing admin group assignment preserved; no rights overwritten.",
        );
        return;
      }
      if (await tx.userGroup.findUnique({ where: { name: "Administrator" } })) {
        throw new Error(
          "Group name already used. Review its configured rights manually.",
        );
      }
      const group = await tx.userGroup.create({
        data: {
          name: "Administrator",
          description: "Administrasi sistem dan hak akses; seluruh cabang.",
          permissions: {
            create: { resource: "system_admin", action: "manage" },
          },
        },
      });
      await tx.user.update({
        where: { id: user.id },
        data: { groupId: group.id },
      });
      await tx.identityAuditEvent.create({
        data: {
          actorId: user.id,
          action: "LOCAL_ADMIN_GROUP_INITIALIZED",
          subjectType: "user",
          subjectId: user.id,
          details: { groupId: group.id },
        },
      });
      console.log(
        "Local admin assigned to the Administrator group with explicit full-access permission.",
      );
    });
  } finally {
    await prisma.$disconnect();
  }
}
main().catch(() => {
  console.error(
    "Admin group bootstrap refused. Check the local target, migrations and existing assignment.",
  );
  process.exitCode = 1;
});
