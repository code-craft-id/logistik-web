import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { signUpload, verifyUpload } = await import("../../src/lib/upload-token");
const original = process.env.BETTER_AUTH_SECRET;
beforeEach(() => {
  process.env.BETTER_AUTH_SECRET = "test-secret-at-least-16-chars";
});
afterEach(() => {
  process.env.BETTER_AUTH_SECRET = original;
});

const claim = {
  actorId: 7,
  transactionId: 42,
  publicId: "lms/pod/abc",
  url: "https://res.cloudinary.com/demo/image/upload/v1/lms/pod/abc.webp",
};

describe("upload tokens", () => {
  it("accepts only the same user, AWB and image within the hour", () => {
    const now = 1_700_000_000_000;
    const token = signUpload(claim, now);
    expect(verifyUpload(claim, token, now + 1000)).toBe(true);
    expect(verifyUpload({ ...claim, actorId: 8 }, token, now)).toBe(false);
    expect(verifyUpload({ ...claim, transactionId: 43 }, token, now)).toBe(
      false,
    );
    expect(
      verifyUpload({ ...claim, publicId: "lms/pod/other" }, token, now),
    ).toBe(false);
    expect(verifyUpload({ ...claim, url: `${claim.url}?x` }, token, now)).toBe(
      false,
    );
    expect(verifyUpload(claim, token, now + 61 * 60 * 1000)).toBe(false);
    expect(verifyUpload(claim, `${token}00`, now)).toBe(false);
    expect(verifyUpload(claim, "garbage", now)).toBe(false);
  });
  it("refuses to sign without a server secret", () => {
    delete process.env.BETTER_AUTH_SECRET;
    expect(() => signUpload(claim)).toThrow("UPLOAD_TOKEN_SECRET_MISSING");
  });
});
