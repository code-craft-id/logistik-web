import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { z } from "zod";
import {
  type AccessActor,
  isAdministrator,
} from "@/features/identity/permissions";
import { prisma } from "@/lib/db";

export type HelpAiConfig = { url: string; key: string; model: string };

// Changing BETTER_AUTH_SECRET makes a stored key unreadable: enter it again.
function secretKey() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET is required.");
  return createHash("sha256").update(`help-ai:${secret}`).digest();
}
export function encryptKey(plain: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secretKey(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64");
}
export function decryptKey(stored: string) {
  const raw = Buffer.from(stored, "base64");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    secretKey(),
    raw.subarray(0, 12),
    { authTagLength: 16 },
  );
  decipher.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([
    decipher.update(raw.subarray(28)),
    decipher.final(),
  ]).toString("utf8");
}

/** Saved setting first, else env. Read per request, so changes apply at once. */
export async function helpAiConfig(): Promise<HelpAiConfig | null> {
  try {
    const row = await prisma.helpAiSetting.findUnique({ where: { id: 1 } });
    if (row)
      return { url: row.url, model: row.model, key: decryptKey(row.keyCipher) };
  } catch (error) {
    console.warn(
      "Help AI setting unreadable:",
      error instanceof Error ? error.name : "unknown error",
    );
  }
  const url = process.env.HELP_AI_URL;
  const key = process.env.HELP_AI_KEY;
  return url && key
    ? { url, key, model: process.env.HELP_AI_MODEL ?? "" }
    : null;
}

const schema = z.object({
  url: z
    .url({ protocol: /^https$/ })
    .max(300)
    .transform((v) => v.replace(/\/+$/, "")),
  model: z.string().trim().max(100),
  key: z.string().trim().max(500),
});

/**
 * Only the one account named in HELP_AI_ADMIN, and only while it is an
 * administrator. Unset means nobody.
 */
export function canManageHelpAi(
  actor: AccessActor,
  username: string | null | undefined,
) {
  const owner = process.env.HELP_AI_ADMIN?.trim().toLowerCase();
  return !!owner && username?.toLowerCase() === owner && isAdministrator(actor);
}

/** Returns an error message, or null when saved. */
export async function saveHelpAiSetting(
  actor: AccessActor,
  username: string | null | undefined,
  input: unknown,
): Promise<string | null> {
  if (!canManageHelpAi(actor, username)) return "Akses ditolak.";
  const parsed = schema.safeParse(input);
  if (!parsed.success) return "Periksa isian: URL harus diawali https://.";
  const { url, model, key } = parsed.data;
  const current = await prisma.helpAiSetting.findUnique({ where: { id: 1 } });
  // A new URL must come with its own key: never send the old key elsewhere.
  if (!key && current?.url !== url)
    return "Isi API key (wajib saat pertama kali atau saat URL berubah).";
  const data = { url, model, ...(key ? { keyCipher: encryptKey(key) } : {}) };
  await prisma.$transaction([
    current
      ? prisma.helpAiSetting.update({ where: { id: 1 }, data })
      : prisma.helpAiSetting.create({
          data: { url, model, keyCipher: encryptKey(key) },
        }),
    prisma.identityAuditEvent.create({
      data: {
        actorId: actor.id,
        action: "HELP_AI_UPDATED",
        subjectType: "help_ai",
        subjectId: 1,
        details: { url, model, keyChanged: Boolean(key) },
      },
    }),
  ]);
  return null;
}
