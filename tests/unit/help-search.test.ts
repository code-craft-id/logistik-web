import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { helpEntries } from "../../src/features/help/knowledge";
import {
  freshMessages,
  HISTORY_TTL_MS,
  searchHelp,
} from "../../src/features/help/search";

describe("feature help chat", () => {
  it.each([
    ["Bagaimana cara entry AWB baru?", "awb-entry"],
    ["cara buat manifest", "manifest"],
    ["gimana catat hasil antar gagal", "drs"],
    ["laporan omset harian", "report-recap"],
    ["kenapa akses ditolak", "users"],
    ["void invoice", "invoice"],
    ["barcode awb", "awb-detail"],
  ])("answers %s with %s", (question, id) => {
    expect(searchHelp(question)[0]?.id).toBe(id);
  });
  it("returns nothing for unrelated text", () => {
    expect(searchHelp("cuaca hari ini")).toEqual([]);
    expect(searchHelp("   ")).toEqual([]);
  });
  it("links only to existing pages and has unique ids", () => {
    expect(new Set(helpEntries.map((e) => e.id)).size).toBe(helpEntries.length);
    for (const { href } of helpEntries)
      if (href)
        expect(existsSync(`src/app/(dashboard)${href}/page.tsx`)).toBe(true);
  });
  it("drops chat history older than ten minutes", () => {
    const now = 10 * HISTORY_TTL_MS;
    const messages = [
      { id: "old", role: "user" as const, text: "a", at: now - HISTORY_TTL_MS },
      { id: "new", role: "user" as const, text: "b", at: now - 1000 },
    ];
    expect(freshMessages(messages, now).map((m) => m.id)).toEqual(["new"]);
  });
});
