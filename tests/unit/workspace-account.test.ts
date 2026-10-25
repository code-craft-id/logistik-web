import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceAccount } from "../../src/features/identity/components/workspace-account";

const mocks = vi.hoisted(() => ({
  currentIdentity: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));
vi.mock("../../src/features/identity/server/context", () => ({
  currentIdentity: mocks.currentIdentity,
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

beforeEach(() => vi.clearAllMocks());

function identity(fullAccess = false) {
  return {
    session: {
      session: { token: "FAKE-PRIVATE-TOKEN" },
      user: {
        id: 7,
        name: "FAKE Operator",
        username: "fake_operator",
        email: "private@example.invalid",
      },
    },
    actor: {
      id: 7,
      status: "ACTIVE",
      branchIds: [10],
      group: {
        id: 3,
        name: "FAKE Group",
        status: "ACTIVE",
        deletedAt: null,
        permissions: fullAccess
          ? [{ resource: "system_admin", action: "manage" }]
          : [],
      },
    },
  };
}

describe("PLT-01 server account display boundary", () => {
  it("redirects a missing or invalid session instead of fabricating an account", async () => {
    mocks.currentIdentity.mockResolvedValue(null);
    await expect(WorkspaceAccount()).rejects.toThrow("REDIRECT:/login");
  });

  it("passes only a narrow display DTO to the client, without tokens, email, IDs or branches", async () => {
    mocks.currentIdentity.mockResolvedValue(identity());
    const component = await WorkspaceAccount();
    expect(component.props).toEqual({
      account: {
        name: "FAKE Operator",
        username: "fake_operator",
        groupName: "FAKE Group",
        fullAccess: false,
      },
    });
    expect(JSON.stringify(component.props)).not.toContain("PRIVATE-TOKEN");
    expect(JSON.stringify(component.props)).not.toContain("example.invalid");
  });

  it("reloads group names and full-access state instead of inferring a role from a label", async () => {
    mocks.currentIdentity
      .mockResolvedValueOnce(identity())
      .mockResolvedValueOnce(identity(true));
    expect((await WorkspaceAccount()).props.account.fullAccess).toBe(false);
    expect((await WorkspaceAccount()).props.account.fullAccess).toBe(true);
    expect(mocks.currentIdentity).toHaveBeenCalledTimes(2);
  });
});
