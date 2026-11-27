import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTicket } from "../../src/features/ticketing/actions";

const { current, save, revalidate } = vi.hoisted(() => ({
  current: vi.fn(),
  save: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: revalidate }));
vi.mock("../../src/features/identity/server/context", () => ({
  currentIdentity: current,
}));
vi.mock("../../src/features/ticketing/server/context", () => ({
  ticketService: { create: save },
}));
const actor = {
  id: 1,
  status: "ACTIVE",
  branchIds: [10],
  group: {
    id: 1,
    name: "FAKE",
    status: "ACTIVE",
    deletedAt: null,
    permissions: [{ resource: "ticket", action: "create" }],
  },
};
beforeEach(() => {
  vi.resetAllMocks();
  current.mockResolvedValue({ actor });
});
describe("ticket Server Action boundary", () => {
  it("independently denies anonymous and missing-grant requests before mutation", async () => {
    current.mockResolvedValueOnce(null);
    expect(await createTicket({})).toMatchObject({ ok: false });
    current.mockResolvedValueOnce({
      actor: { ...actor, group: { ...actor.group, permissions: [] } },
    });
    expect(await createTicket({})).toMatchObject({ ok: false });
    expect(save).not.toHaveBeenCalled();
    expect(revalidate).not.toHaveBeenCalled();
  });
  it("returns only persisted ID and invalidates the list after successful save", async () => {
    save.mockResolvedValue({ id: 4, idempotencyKey: "FAKE-private-replay" });
    expect(await createTicket({ subject: "FAKE" })).toEqual({
      ok: true,
      id: 4,
    });
    expect(revalidate).toHaveBeenCalledWith("/ticketting");
  });
  it("sanitizes unexpected database errors and does not invalidate on failure", async () => {
    save.mockRejectedValue(
      new Error("FAKE-private-replay database credential"),
    );
    const result = await createTicket({});
    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain("FAKE-private");
    expect(revalidate).not.toHaveBeenCalled();
  });
});
