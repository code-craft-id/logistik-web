import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { cloudinaryConfigured, imageKind, signParams, uploadWebp, UploadError } =
  await import("../../src/lib/cloudinary");

const env = { ...process.env };
afterEach(() => {
  process.env = { ...env };
  vi.unstubAllGlobals();
});

const webp = () => {
  const bytes = new Uint8Array(32);
  bytes.set(
    [..."RIFF"].map((c) => c.charCodeAt(0)),
    0,
  );
  bytes.set(
    [..."WEBP"].map((c) => c.charCodeAt(0)),
    8,
  );
  return bytes;
};

describe("Cloudinary photo upload", () => {
  it("signs sorted parameters with the secret (Cloudinary rule)", () => {
    const expected = createHash("sha1")
      .update("folder=lms/pod&format=webp&timestamp=1700000000SECRET")
      .digest("hex");
    expect(
      signParams(
        { timestamp: "1700000000", format: "webp", folder: "lms/pod" },
        "SECRET",
      ),
    ).toBe(expected);
  });

  it("recognises images by content, not by the claimed type", () => {
    expect(imageKind(webp())).toBe("webp");
    expect(imageKind(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("jpeg");
    expect(imageKind(new TextEncoder().encode("<svg onload=x>"))).toBeNull();
  });

  it("explains which env values are missing and never calls the network", async () => {
    delete process.env.CLOUDINARY_CLOUD_NAME;
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    expect(cloudinaryConfigured()).toBe(false);
    await expect(
      uploadWebp(new File([webp()], "a.webp", { type: "image/webp" })),
    ).rejects.toThrow("CLOUDINARY_CLOUD_NAME");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects non-images and oversize files before uploading", async () => {
    Object.assign(process.env, {
      CLOUDINARY_CLOUD_NAME: "demo",
      CLOUDINARY_API_KEY: "key",
      CLOUDINARY_API_SECRET: "secret",
    });
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    await expect(
      uploadWebp(new File(["hello"], "a.webp", { type: "image/webp" })),
    ).rejects.toBeInstanceOf(UploadError);
    await expect(
      uploadWebp(new File([new Uint8Array(1_000_001)], "big.webp")),
    ).rejects.toThrow("terlalu besar");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("uploads signed as WebP and returns the secure URL", async () => {
    Object.assign(process.env, {
      CLOUDINARY_CLOUD_NAME: "demo",
      CLOUDINARY_API_KEY: "key",
      CLOUDINARY_API_SECRET: "secret",
    });
    const fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          secure_url:
            "https://res.cloudinary.com/demo/image/upload/v1/lms/pod/x.webp",
          public_id: "lms/pod/x",
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetch);
    const result = await uploadWebp(
      new File([webp()], "a.webp", { type: "image/webp" }),
    );
    expect(result.publicId).toBe("lms/pod/x");
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe("https://api.cloudinary.com/v1_1/demo/image/upload");
    const body = init.body as FormData;
    expect(body.get("format")).toBe("webp");
    expect(body.get("api_key")).toBe("key");
    expect(body.get("api_secret")).toBeNull();
    expect(body.get("signature")).toBe(
      signParams(
        {
          folder: "lms/pod",
          format: "webp",
          timestamp: String(body.get("timestamp")),
        },
        "secret",
      ),
    );
  });
});
