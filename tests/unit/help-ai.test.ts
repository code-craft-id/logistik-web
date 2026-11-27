import { afterEach, describe, expect, it, vi } from "vitest";
import { askHelpAi } from "../../src/features/help/server";
import {
  decryptKey,
  encryptKey,
  saveHelpAiSetting,
} from "../../src/features/help/settings";

const row = vi.hoisted(() => ({ value: null as object | null }));
vi.mock("@/lib/db", () => ({
  prisma: { helpAiSetting: { findUnique: async () => row.value } },
}));

const actor = {
  id: 1,
  status: "ACTIVE",
  group: {
    id: 1,
    name: "FAKE Kurir",
    status: "ACTIVE",
    deletedAt: null,
    permissions: [{ resource: "manifest", action: "view" }],
  },
  branchIds: [1],
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
function configure() {
  vi.stubEnv("HELP_AI_URL", "https://ai.invalid/v1/");
  vi.stubEnv("HELP_AI_KEY", "fake-key");
}

describe("help chat AI", () => {
  it("lets only administrators save, and never moves the old key to a new URL", async () => {
    const input = { url: "https://new.invalid/v1", model: "m", key: "" };
    expect(await saveHelpAiSetting(actor, input)).toBe("Khusus administrator.");
    const admin = {
      ...actor,
      group: {
        ...actor.group,
        permissions: [{ resource: "system_admin", action: "manage" }],
      },
    };
    row.value = { url: "https://old.invalid/v1", model: "m", keyCipher: "x" };
    expect(await saveHelpAiSetting(admin, input)).toContain("API key");
    expect(
      await saveHelpAiSetting(admin, { ...input, url: "http://new.invalid" }),
    ).toContain("https://");
    row.value = null;
  });
  it("encrypts the key and prefers the saved setting over env", async () => {
    configure();
    vi.stubEnv("BETTER_AUTH_SECRET", "fake-secret");
    const keyCipher = encryptKey("saved-key");
    expect(keyCipher).not.toContain("saved-key");
    expect(decryptKey(keyCipher)).toBe("saved-key");
    row.value = { url: "https://saved.invalid/v1", model: "m", keyCipher };
    const fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    vi.stubGlobal("fetch", fetch);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await askHelpAi(actor, "manifest");
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe(
      "Bearer saved-key",
    );
    row.value = null;
  });
  it("is off without URL and key", async () => {
    vi.stubEnv("HELP_AI_URL", "");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    expect(await askHelpAi(actor, "manifest")).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("sends only help texts of pages the role may view", async () => {
    configure();
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: " Jawab " } }] }),
    });
    vi.stubGlobal("fetch", fetch);
    expect(await askHelpAi(actor, "buat manifest")).toBe("Jawab");
    expect(fetch.mock.calls[0][0]).toBe(
      "https://ai.invalid/v1/chat/completions",
    );
    const system = JSON.parse(fetch.mock.calls[0][1].body).messages[0].content;
    expect(system).toContain("FAKE Kurir");
    expect(system).not.toContain("## Dashboard");
  });
  it.each([
    ["a rejected key", () => Promise.resolve({ ok: false, status: 401 })],
    ["a network error", () => Promise.reject(new Error("offline"))],
    [
      "an empty reply",
      () => Promise.resolve({ ok: true, json: async () => ({}) }),
    ],
  ])("falls back on %s", async (_, impl) => {
    configure();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(impl));
    expect(await askHelpAi(actor, "manifest")).toBeNull();
  });
});
