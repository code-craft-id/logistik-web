import type { BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username } from "better-auth/plugins";
import type { PrismaClient } from "../db/generated/client";

/** Provider storage contract; username login does not grant application permissions. */
export function authSchemaOptions(client: PrismaClient) {
  return {
    database: prismaAdapter(client, { provider: "postgresql" }),
    advanced: { database: { generateId: "serial" } },
    account: { modelName: "authAccount" },
    user: {
      additionalFields: {
        status: {
          type: "string",
          required: false,
          defaultValue: "ACTIVE",
          input: false,
        },
      },
    },
    plugins: [username()],
  } satisfies BetterAuthOptions;
}
