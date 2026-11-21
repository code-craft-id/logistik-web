import { beforeEach, expect, it, vi } from "vitest";

const { execute } = vi.hoisted(() => ({ execute: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("../../src/features/finance/server/context", () => ({
  financeService: { execute },
}));

import { financeCommand } from "../../src/features/finance/actions";

beforeEach(() => vi.resetAllMocks());

it("explains duplicate finance codes instead of asking for an identical retry", async () => {
  execute.mockRejectedValueOnce(
    Object.assign(new Error("unique"), { code: "P2002" }),
  );
  expect(await financeCommand({})).toEqual({
    ok: false,
    message: "Kode atau nomor sudah dipakai. Gunakan kode lain.",
  });
});

it("explains missing or changed finance records", async () => {
  execute.mockRejectedValueOnce(
    Object.assign(new Error("missing"), { code: "P2025" }),
  );
  expect((await financeCommand({})).message).toBe(
    "Data tidak ditemukan atau sudah berubah. Muat ulang halaman.",
  );
});

it("keeps unknown failures sanitized", async () => {
  execute.mockRejectedValueOnce(new Error("connection string leaked"));
  const result = await financeCommand({});
  expect(result.ok).toBe(false);
  expect(result.message).not.toContain("connection");
});
