import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as passwordPost } from "../../src/app/(dashboard)/profile/api/password/route";
import { GET, PATCH } from "../../src/app/(dashboard)/profile/api/route";
import { DELETE } from "../../src/app/(dashboard)/profile/api/sessions/[id]/route";
import {
  GET as sessionsGet,
  POST as sessionsPost,
} from "../../src/app/(dashboard)/profile/api/sessions/route";
import {
  profilePasswordSchema,
  profileSessionIdSchema,
  profileUpdateSchema,
  sessionRevokeSchema,
} from "../../src/features/identity/profile-validation";
import { IdentityError } from "../../src/features/identity/server/access";

const actions = vi.hoisted(() => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
  getUserSessions: vi.fn(),
  revokeAllOtherSessions: vi.fn(),
  revokeAllSessions: vi.fn(),
  revokeSession: vi.fn(),
}));
vi.mock("../../src/app/(dashboard)/profile/actions", () => actions);
beforeEach(() => {
  vi.resetAllMocks();
  for (const fn of Object.values(actions))
    fn.mockResolvedValue({ success: true });
});
const request = (
  path: string,
  method: string,
  body: string,
  origin = "http://localhost:3000",
) =>
  new Request(`http://localhost:3000/profile/api${path}`, {
    method,
    headers: { Origin: origin, "Content-Type": "application/json" },
    body,
  });

describe("PLT-01 profile HTTP entry-point contracts", () => {
  it("returns private uncached data and sanitized auth/database failures", async () => {
    expect((await GET()).headers.get("Cache-Control")).toBe(
      "private, no-store",
    );
    actions.getProfile.mockRejectedValueOnce(
      new IdentityError("UNAUTHENTICATED", 401, "Silakan masuk kembali."),
    );
    expect((await GET()).status).toBe(401);
    actions.getProfile.mockRejectedValueOnce(
      new Error("FAKE-token-SQL-private"),
    );
    const failed = await GET();
    expect(failed.status).toBe(500);
    expect(JSON.stringify(await failed.json())).not.toContain("FAKE-token");
  });

  it.each([
    "profile",
    "password",
    "sessions",
    "session",
  ])("denies cross-origin %s mutations before invoking an action", async (kind) => {
    const req = request(
      "",
      kind === "profile" ? "PATCH" : kind === "session" ? "DELETE" : "POST",
      "{}",
      "https://external.invalid",
    );
    const response =
      kind === "profile"
        ? await PATCH(req)
        : kind === "password"
          ? await passwordPost(req)
          : kind === "sessions"
            ? await sessionsPost(req)
            : await DELETE(req, { params: Promise.resolve({ id: "1" }) });
    expect(response.status).toBe(403);
    expect(
      Object.values(actions).every((fn) => fn.mock.calls.length === 0),
    ).toBe(true);
  });

  it("rejects malformed JSON and forged current-session overrides", async () => {
    expect((await PATCH(request("", "PATCH", "{"))).status).toBe(400);
    expect(
      (
        await sessionsPost(
          request(
            "/sessions",
            "POST",
            JSON.stringify({ scope: "others", currentSessionId: 999 }),
          ),
        )
      ).status,
    ).toBe(400);
    expect(actions.revokeAllOtherSessions).not.toHaveBeenCalled();
  });

  it("routes explicit all/others commands without forwarding a client-selected current session", async () => {
    for (const scope of ["all", "others"])
      expect(
        (
          await sessionsPost(
            request("/sessions", "POST", JSON.stringify({ scope })),
          )
        ).status,
      ).toBe(200);
    expect(actions.revokeAllSessions).toHaveBeenCalledExactlyOnceWith();
    expect(actions.revokeAllOtherSessions).toHaveBeenCalledExactlyOnceWith();
  });

  it("preserves the entire record ID for validation instead of accepting numeric prefixes", async () => {
    await DELETE(request("/sessions/1x", "DELETE", "{}"), {
      params: Promise.resolve({ id: "1x" }),
    });
    expect(actions.revokeSession).toHaveBeenCalledWith("1x");
    await sessionsGet(
      new Request(
        "http://localhost:3000/profile/api/sessions?page=2&pageSize=10",
      ),
    );
    expect(actions.getUserSessions).toHaveBeenCalledWith({
      page: "2",
      pageSize: "10",
    });
  });
});

describe("PLT-01 profile strict validation", () => {
  it.each([
    {},
    { name: "" },
    { name: " ".repeat(3) },
    { name: "x".repeat(101) },
    { name: "FAKE", groupId: 1 },
    { name: "FAKE", userId: 2 },
    { name: "FAKE", image: "https://external.invalid" },
  ])("rejects invalid self-profile payload %j", (input) => {
    expect(profileUpdateSchema.safeParse(input).success).toBe(false);
  });
  it("normalizes display names and bounds both old and new passwords without trimming secrets", () => {
    expect(profileUpdateSchema.parse({ name: " FAKE Name " })).toEqual({
      name: "FAKE Name",
    });
    const input = {
      currentPassword: " FAKE old ",
      newPassword: " FAKE next ",
      confirmPassword: " FAKE next ",
    };
    expect(profilePasswordSchema.parse(input)).toEqual(input);
    for (const values of [
      { ...input, currentPassword: "" },
      { ...input, currentPassword: "x".repeat(129) },
      { ...input, newPassword: "short", confirmPassword: "short" },
      {
        ...input,
        newPassword: "x".repeat(129),
        confirmPassword: "x".repeat(129),
      },
      { ...input, confirmPassword: "different" },
    ])
      expect(profilePasswordSchema.safeParse(values).success).toBe(false);
    expect(
      sessionRevokeSchema.safeParse({ scope: "all", userId: 2 }).success,
    ).toBe(false);
    expect(profileSessionIdSchema.parse("12")).toBe(12);
    for (const id of ["12x", "01", 0, [12], {}, null]) {
      expect(profileSessionIdSchema.safeParse(id).success).toBe(false);
    }
  });
});
