import type { BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import type { PrismaClient } from "../db/generated/client";

/** Schema/adapter contract only. PLT-01 owns runtime auth and route activation. */
export function authSchemaOptions(client: PrismaClient) {
  return {
    database: prismaAdapter(client, { provider: "postgresql" }),
    advanced: { database: { generateId: "serial" } },
    account: { modelName: "authAccount" },
  } satisfies BetterAuthOptions;
}
