import { type HelpEntry, helpEntries } from "./knowledge";

const STOPWORDS = new Set(
  "apa apakah bagaimana gimana cara caranya untuk yang di ke dari dan atau ini itu saya aku kita bisa tidak nggak ga mau ingin dengan pada ada kenapa mengapa dimana kapan mana tolong dong ya sih kah lah hari".split(
    " ",
  ),
);

export function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/**
 * Rank entries for a question: whole keyword phrases weigh most, then title
 * and keyword tokens, then answer text. Returns best matches first.
 */
export function searchHelp(question: string, limit = 3): HelpEntry[] {
  const q = question.toLowerCase();
  const words = tokens(question);
  if (!words.length) return [];
  const scored = helpEntries.map((entry) => {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (keyword.includes(" ") && q.includes(keyword)) score += 6;
    }
    const titleWords = new Set(tokens(entry.title));
    const keywordWords = new Set(entry.keywords.flatMap(tokens));
    const answerWords = new Set(tokens(entry.answer));
    for (const word of words) {
      if (keywordWords.has(word)) score += 3;
      if (titleWords.has(word)) score += 2;
      if (answerWords.has(word)) score += 0.5;
    }
    return { entry, score };
  });
  return scored
    .filter((s) => s.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.entry);
}

export const HISTORY_TTL_MS = 60 * 60 * 1000;

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  href?: string;
  at: number;
};

/** Drop messages older than one hour. */
export function freshMessages(messages: ChatMessage[], now = Date.now()) {
  return messages.filter((m) => now - m.at < HISTORY_TTL_MS);
}
