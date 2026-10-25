import "dotenv/config";
import { pathToFileURL } from "node:url";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { localDatabaseUrl } from "../prisma/local-database.mjs";

/**
 * Explicit local development bootstrap, not a production seed or RBAC policy.
 * Preserve existing identity, group and branch assignments. Never delete users.
 */
export async function provisionLocalAdmin(prisma, password) {
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 128
  ) {
    throw new Error("LOCAL_ADMIN_PASSWORD must contain 8 to 128 characters.");
  }
  return prisma.$transaction(
    async (tx) => {
      const email = "admin@logistik.local";
      const username = "admin";
      const existing = await tx.user.findUnique({ where: { email } });
      const usernameOwner = await tx.user.findUnique({ where: { username } });
      if (usernameOwner && usernameOwner.id !== existing?.id) {
        throw new Error("Admin username is occupied; no account was changed.");
      }
      if (existing?.username && existing.username !== username) {
        throw new Error(
          "Existing local admin has another username; review required.",
        );
      }
      const user = existing
        ? await tx.user.update({
            where: { id: existing.id },
            data: { username, displayUsername: username },
          })
        : await tx.user.create({
            data: {
              name: "Administrator",
              email,
              username,
              displayUsername: username,
              emailVerified: true,
            },
          });
      const credentials = await tx.authAccount.findMany({
        where: { userId: user.id, providerId: "credential" },
      });
      if (credentials.length > 1) {
        throw new Error(
          "Multiple credential accounts found; no account was changed.",
        );
      }
      const credential = credentials[0];
      const passwordMatches =
        credential?.password &&
        (await verifyPassword({ hash: credential.password, password }).catch(
          () => false,
        ));
      if (!passwordMatches) {
        const data = {
          accountId: String(user.id),
          providerId: "credential",
          password: await hashPassword(password),
        };
        if (credential) {
          await tx.authAccount.update({ where: { id: credential.id }, data });
        } else {
          await tx.authAccount.create({ data: { ...data, userId: user.id } });
        }
        // Password changes invalidate sessions; same-password reruns do not.
        await tx.session.deleteMany({ where: { userId: user.id } });
      }
      return { id: user.id, username: user.username };
    },
    { timeout: 15000 },
  );
}

async function main() {
  // Validate before importing/constructing the database client.
  const connectionString = localDatabaseUrl(process.env.DATABASE_URL, {
    purpose: "seed",
    nodeEnv: process.env.NODE_ENV,
  });
  const password = process.env.LOCAL_ADMIN_PASSWORD;
  if (!password) throw new Error("Set LOCAL_ADMIN_PASSWORD explicitly.");
  const [{ PrismaClient }, { PrismaPg }] = await Promise.all([
    import("../src/lib/db/generated/client.ts"),
    import("@prisma/adapter-pg"),
  ]);
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  try {
    const user = await provisionLocalAdmin(prisma, password);
    console.log(`Local login ready: username=${user.username}, id=${user.id}.`);
    console.log("Existing permissions and branch assignments were preserved.");
  } finally {
    await prisma.$disconnect();
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch(() => {
    // Never print Prisma errors containing credentials, queries or password hashes.
    console.error(
      "Local admin setup failed. Check the local target, password, migrations and username conflicts.",
    );
    process.exitCode = 1;
  });
}
