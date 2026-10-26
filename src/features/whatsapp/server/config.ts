import "server-only";
import { z } from "zod";
import type { GatewayConfigurationState } from "../contracts";

const settings = z.object({
  url: z.url().max(2048),
  apiKey: z
    .string()
    .min(32)
    .max(512)
    .regex(/^[\x21-\x7e]+$/),
});
type Environment = Record<string, string | undefined>;
export type WhatsAppGatewayConfig =
  | { state: Exclude<GatewayConfigurationState, "configured"> }
  | { state: "configured"; url: string; apiKey: string };

/** Preparation only: reading configuration never opens a gateway connection. */
export function readWhatsAppGatewayConfig(
  environment: Environment = process.env,
): WhatsAppGatewayConfig {
  const url = environment.WHATSAPP_GATEWAY_URL?.trim() ?? "";
  const apiKey = environment.WHATSAPP_GATEWAY_API_KEY ?? "";
  if (!url && !apiKey) return { state: "not_configured" };
  const parsed = settings.safeParse({ url, apiKey });
  if (!parsed.success) return { state: "invalid_configuration" };
  const address = new URL(parsed.data.url);
  const localHttp =
    environment.NODE_ENV !== "production" &&
    address.protocol === "http:" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(address.hostname);
  if (
    (address.protocol !== "https:" && !localHttp) ||
    address.username ||
    address.password ||
    address.search ||
    address.hash
  )
    return { state: "invalid_configuration" };
  return { state: "configured", url: address.href, apiKey: parsed.data.apiKey };
}
