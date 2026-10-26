import "server-only";
import { betterAuth } from "better-auth";
import { activeActor } from "@/features/identity/permissions";
import { loadAccessActor } from "@/features/identity/server/access";
import { prisma } from "@/lib/db";
import { managedIdentityPaths } from "./managed-paths";
import { authSchemaOptions } from "./schema-options";

function createAuth() {
  return betterAuth({
    ...authSchemaOptions(prisma),
    disabledPaths: managedIdentityPaths,
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      requireEmailVerification: false,
      minPasswordLength: 8,
      maxPasswordLength: 128,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      // Rights are loaded from the DB per entry point. Revoked sessions must not survive a cookie cache.
      cookieCache: { enabled: false },
    },
    databaseHooks: {
      session: {
        create: {
          before: async (session) => {
            const id = Number(session.userId);
            if (!Number.isSafeInteger(id) || id <= 0) return false;
            return activeActor(await loadAccessActor(prisma, id));
          },
        },
      },
    },
    trustedOrigins: ["http://localhost:3000", "http://127.0.0.1:3000"],
  });
}
let instance: ReturnType<typeof createAuth> | undefined;
export function getAuth() {
  if (!instance) instance = createAuth();
  return instance;
}
/** Lazy compatibility facade; no untyped or fake build-time auth implementation. */
export const auth = {
  get api() {
    return getAuth().api;
  },
  handler: (request: Request) => getAuth().handler(request),
};
