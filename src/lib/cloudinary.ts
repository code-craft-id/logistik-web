import "server-only";

import { createHash } from "node:crypto";

/**
 * Minimal signed Cloudinary upload over the REST API (no SDK). Needs only
 * CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET; the
 * secret never leaves the server. Images are stored as WebP.
 */
type Config = { cloud: string; key: string; secret: string; folder: string };

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

function config(): Config | null {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const key = process.env.CLOUDINARY_API_KEY?.trim();
  const secret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloud || !key || !secret) return null;
  if (!/^[a-z0-9_-]{1,100}$/i.test(cloud)) return null;
  return { cloud, key, secret, folder: "lms/pod" };
}

export function cloudinaryConfigured() {
  return config() !== null;
}

/** Cloudinary signature: SHA-1 of sorted "k=v" pairs joined by & + secret. */
export function signParams(params: Record<string, string>, secret: string) {
  const payload = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1")
    .update(payload + secret)
    .digest("hex");
}

const MAX_BYTES = 1_000_000;

/** Accept only WebP, JPEG or PNG by magic bytes (not by the claimed type). */
export function imageKind(bytes: Uint8Array) {
  const ascii = (from: number, to: number) =>
    String.fromCharCode(...bytes.slice(from, to));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "jpeg";
  if (ascii(1, 4) === "PNG") return "png";
  return null;
}

export async function uploadWebp(
  file: File,
  folder?: string,
): Promise<{ url: string; publicId: string }> {
  const cfg = config();
  if (!cfg)
    throw new UploadError(
      "Upload foto belum diaktifkan. Admin perlu mengisi CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY dan CLOUDINARY_API_SECRET di .env.",
    );
  if (file.size === 0) throw new UploadError("File foto kosong.");
  if (file.size > MAX_BYTES)
    throw new UploadError(
      "Foto terlalu besar (maksimal 1 MB setelah dikompres).",
    );
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = imageKind(bytes);
  if (!kind)
    throw new UploadError(
      "File bukan gambar yang didukung (WebP, JPEG atau PNG).",
    );
  const params = {
    folder: folder ?? cfg.folder,
    format: "webp",
    timestamp: String(Math.floor(Date.now() / 1000)),
  };
  const body = new FormData();
  body.set("file", new Blob([bytes], { type: `image/${kind}` }), `pod.${kind}`);
  for (const [k, v] of Object.entries(params)) body.set(k, v);
  body.set("api_key", cfg.key);
  body.set("signature", signParams(params, cfg.secret));
  let response: Response;
  try {
    response = await fetch(
      `https://api.cloudinary.com/v1_1/${cfg.cloud}/image/upload`,
      { method: "POST", body, signal: AbortSignal.timeout(30_000) },
    );
  } catch {
    throw new UploadError(
      "Gagal menghubungi Cloudinary. Periksa koneksi internet lalu coba lagi.",
    );
  }
  const json = (await response.json().catch(() => null)) as {
    secure_url?: string;
    public_id?: string;
  } | null;
  if (!response.ok || !json?.secure_url || !json.public_id)
    throw new UploadError(
      response.status === 401
        ? "Upload ditolak Cloudinary: periksa CLOUDINARY_API_KEY dan CLOUDINARY_API_SECRET."
        : "Upload foto gagal di Cloudinary. Coba lagi.",
    );
  return { url: json.secure_url, publicId: json.public_id };
}

/** Best-effort removal of an uploaded image (used when saving fails). */
export async function destroyImage(publicId: string) {
  const cfg = config();
  if (!cfg) return;
  const params = {
    public_id: publicId,
    timestamp: String(Math.floor(Date.now() / 1000)),
  };
  const body = new FormData();
  for (const [k, v] of Object.entries(params)) body.set(k, v);
  body.set("api_key", cfg.key);
  body.set("signature", signParams(params, cfg.secret));
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cfg.cloud}/image/destroy`,
      { method: "POST", body, signal: AbortSignal.timeout(15_000) },
    );
    const result = (await response.json().catch(() => null)) as {
      result?: string;
    } | null;
    if (
      !response.ok ||
      (result?.result !== "ok" && result?.result !== "not found")
    )
      console.warn("cloudinary destroy failed", {
        publicId,
        status: response.status,
        result: result?.result ?? null,
      });
  } catch (error) {
    // An orphan image remains; log it so it can be removed manually.
    console.warn("cloudinary destroy failed", {
      publicId,
      error: error instanceof Error ? error.name : "unknown",
    });
  }
}
