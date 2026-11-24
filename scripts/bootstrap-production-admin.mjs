import { pathToFileURL } from "node:url";
import { hashPassword } from "better-auth/crypto";

/**
 * One-time bootstrap of the first administrator in an EMPTY production
 * database (owner decision 2026-11-24: start empty + 1 admin). Refuses when
 * any user already exists, so it can never overwrite real accounts.
 * Creates group ADMINISTRATOR with system_admin:manage, the user and its
 * Better Auth credential, plus an audit event, in one transaction.
 */
export function validateAdminInput(env) {
  const input = {
    username: (env.ADMIN_USERNAME ?? "").trim(),
    email: (env.ADMIN_EMAIL ?? "").trim().toLowerCase(),
    name: (env.ADMIN_NAME ?? "Administrator").trim(),
    password: env.ADMIN_PASSWORD ?? "",
    company: (env.COMPANY_NAME ?? "").trim(),
    branches: [env.BRANCH_1, env.BRANCH_2]
      .map((b) => (b ?? "").trim().toUpperCase())
      .filter(Boolean),
  };
  if (!input.company || input.company.length > 100)
    throw new Error("COMPANY_NAME wajib, maksimal 100 karakter.");
  if (input.branches.length !== 2 || input.branches[0] === input.branches[1])
    throw new Error("BRANCH_1 dan BRANCH_2 wajib diisi dan berbeda.");
  if (!/^[a-z0-9_.]{3,30}$/.test(input.username))
    throw new Error("ADMIN_USERNAME: 3-30 huruf kecil, angka, titik atau _.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email))
    throw new Error("ADMIN_EMAIL tidak valid.");
  // Owner chose a short first password; change it right after first login.
  if (input.password.length < 6 || input.password.length > 128)
    throw new Error("ADMIN_PASSWORD harus 6-128 karakter.");
  if (!input.name || input.name.length > 100)
    throw new Error("ADMIN_NAME wajib, maksimal 100 karakter.");
  return input;
}

export async function bootstrapAdmin(prisma, input, hash = hashPassword) {
  return prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(71642, 2)`;
      if ((await tx.user.count()) > 0) throw new Error("REFUSED_NOT_EMPTY");
      // One company, one head office and the two branches.
      const company = await tx.company.create({
        data: {
          name: input.company,
          isDepositAgent: false,
          showPriceOnPrint: true,
        },
      });
      const office = await tx.office.create({
        data: {
          companyId: company.id,
          name: "KANTOR PUSAT",
          code: "PST",
          status: "ACTIVE",
        },
      });
      const branchIds = [];
      for (const name of input.branches) {
        const branch = await tx.branch.create({
          data: {
            officeId: office.id,
            name,
            // Three-letter code (used in AWB numbers); suffix the 2nd if equal.
            code:
              (name.replace(/[^A-Z0-9]/g, "").slice(0, 3) || "CB") +
              (branchIds.length &&
              input.branches[0].slice(0, 3) === name.slice(0, 3)
                ? "2"
                : ""),
            status: "ACTIVE",
          },
        });
        branchIds.push(branch.id);
      }
      const group = await tx.userGroup.create({
        data: {
          name: "ADMINISTRATOR",
          description: "Administrator sistem; akses penuh semua cabang.",
          permissions: {
            create: { resource: "system_admin", action: "manage" },
          },
        },
      });
      const user = await tx.user.create({
        data: {
          name: input.name,
          email: input.email,
          username: input.username,
          displayUsername: input.username,
          emailVerified: true,
          groupId: group.id,
          allowedBranches: {
            create: branchIds.map((branchId) => ({ branchId })),
          },
        },
      });
      await tx.authAccount.create({
        data: {
          userId: user.id,
          accountId: String(user.id),
          providerId: "credential",
          password: await hash(input.password),
        },
      });
      await tx.identityAuditEvent.create({
        data: {
          actorId: user.id,
          action: "PRODUCTION_ADMIN_BOOTSTRAPPED",
          subjectType: "user",
          subjectId: user.id,
          details: { groupId: group.id },
        },
      });
      return {
        id: user.id,
        username: user.username,
        branches: branchIds.length,
      };
    },
    { timeout: 20000 },
  );
}

async function main() {
  if (process.env.CONFIRM_EMPTY_DATABASE !== "yes")
    throw new Error(
      "Set CONFIRM_EMPTY_DATABASE=yes setelah memastikan target benar.",
    );
  const connectionString = process.env.TARGET_DATABASE_URL;
  if (!connectionString?.startsWith("postgres"))
    throw new Error("Set TARGET_DATABASE_URL (URL direct database tujuan).");
  const input = validateAdminInput(process.env);
  const [{ PrismaClient }, { PrismaPg }] = await Promise.all([
    import("../src/lib/db/generated/client.ts"),
    import("@prisma/adapter-pg"),
  ]);
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  try {
    const user = await bootstrapAdmin(prisma, input);
    console.log(
      `Admin siap: username=${user.username}, id=${user.id}, cabang=${user.branches}. Segera ganti password setelah login.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch((error) => {
    // Never print Prisma errors: they can contain the URL or password hash.
    const known =
      error instanceof Error &&
      (error.message.startsWith("ADMIN_") ||
        error.message.startsWith("Set ") ||
        error.message === "REFUSED_NOT_EMPTY");
    console.error(
      error?.message === "REFUSED_NOT_EMPTY"
        ? "Ditolak: database sudah punya user. Script ini hanya untuk database kosong."
        : known
          ? error.message
          : "Bootstrap admin gagal. Periksa URL target, migrasi dan koneksi.",
    );
    process.exitCode = 1;
  });
