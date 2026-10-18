import type { Prisma } from "../src/lib/db/generated/client";

export function seedFakeRecords(tx: Prisma.TransactionClient): Promise<void>;
