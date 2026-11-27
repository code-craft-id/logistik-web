import "server-only";
import { canViewPath } from "@/components/shell/accessible-navigation";
import {
  type AccessActor,
  isAdministrator,
} from "@/features/identity/permissions";
import { helpEntries } from "./knowledge";
import { helpAiConfig } from "./settings";

/**
 * AI answer for the help chat (OpenAI-compatible chat completions). Returns
 * null when not configured or on any failure; the chat then answers from the
 * local knowledge file. Only the question, the role and help texts are sent.
 */
export async function askHelpAi(
  actor: AccessActor,
  question: string,
): Promise<string | null> {
  const config = await helpAiConfig();
  if (!config) return null;
  const url = config.url.replace(/\/+$/, "");
  const { key, model } = config;
  const allowed = helpEntries.filter(
    (e) => !e.href || canViewPath(actor, e.href),
  );
  const rights = isAdministrator(actor)
    ? "akses penuh"
    : (actor.group?.permissions ?? [])
        .map((p) => `${p.resource}:${p.action}`)
        .join(", ");
  const system = [
    "Anda asisten bantuan aplikasi LMS (logistik). Jawab dalam Bahasa Indonesia, singkat, teks biasa tanpa markdown.",
    "Jawab hanya dari MATERI di bawah. Bila tidak ada di materi, atau menyangkut fitur di luar hak user, katakan Anda tidak punya penjelasannya atau user perlu meminta hak ke admin. Jangan mengarang.",
    `Role user: ${actor.group?.name ?? "tanpa grup"}. Hak: ${rights || "tidak ada"}.`,
    "MATERI:",
    ...allowed.map((e) => `## ${e.title}\n${e.answer}`),
  ].join("\n");
  try {
    const response = await fetch(
      url.endsWith("/chat/completions") ? url : `${url}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model || undefined,
          messages: [
            { role: "system", content: system },
            { role: "user", content: question },
          ],
        }),
        signal: AbortSignal.timeout(15_000),
        cache: "no-store",
      },
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    return typeof text === "string" && text.trim()
      ? text.trim().slice(0, 4000)
      : null;
  } catch (error) {
    // Never log the key or the question.
    console.warn(
      "Help AI unavailable:",
      error instanceof Error ? error.message : "unknown error",
    );
    return null;
  }
}
