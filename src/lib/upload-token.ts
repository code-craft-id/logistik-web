import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Short-lived proof that the server itself uploaded an image for this user
 * and AWB, so a later save cannot attach arbitrary URLs. Signed with the
 * server auth secret; valid for one hour.
 */
type Claim = {
  actorId: number;
  transactionId: number;
  outcome?: "DELIVERED" | "RETURNED";
  publicId: string;
  url: string;
};
const TTL_MS = 60 * 60 * 1000;

function secret() {
  const value = process.env.BETTER_AUTH_SECRET;
  if (!value || value.length < 16)
    throw new Error("UPLOAD_TOKEN_SECRET_MISSING");
  return value;
}
const payload = (c: Claim, exp: number) =>
  [
    c.actorId,
    c.transactionId,
    c.outcome ?? "DELIVERED",
    c.publicId,
    c.url,
    exp,
  ].join("|");

export function signUpload(claim: Claim, now = Date.now()) {
  const exp = now + TTL_MS;
  const mac = createHmac("sha256", secret())
    .update(payload(claim, exp))
    .digest("hex");
  return `${exp}.${mac}`;
}

export function verifyUpload(claim: Claim, token: string, now = Date.now()) {
  const [expText, mac] = String(token).split(".");
  const exp = Number(expText);
  if (!Number.isSafeInteger(exp) || exp < now || !mac) return false;
  const expected = createHmac("sha256", secret())
    .update(payload(claim, exp))
    .digest();
  const given = Buffer.from(mac, "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}
