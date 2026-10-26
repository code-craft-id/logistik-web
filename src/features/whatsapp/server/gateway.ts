import "server-only";
import { IdentityError } from "@/features/identity/server/access";
import { gatewayQrSchema, gatewaySessionSchema } from "../contracts";
import { readWhatsAppGatewayConfig } from "./config";

const unavailable = () =>
  new IdentityError(
    "GATEWAY_UNAVAILABLE",
    502,
    "Server WhatsApp tidak dapat dihubungi atau responsnya tidak valid. Periksa status sebelum mencoba kembali.",
  );

/** One gateway/key namespace per LMS environment. No automatic mutation retries. */
export function createWhatsAppGateway(
  readConfig = readWhatsAppGatewayConfig,
  transport: typeof fetch = fetch,
) {
  async function request(
    branchId: number,
    method: "GET" | "POST" | "DELETE",
    qr = false,
  ) {
    const config = readConfig();
    if (config.state !== "configured")
      throw new IdentityError(
        "GATEWAY_NOT_CONFIGURED",
        503,
        "Pengaturan server WhatsApp belum siap.",
      );
    try {
      const response = await transport(
        `${config.url.replace(/\/$/, "")}/v1/branches/${branchId}/session${qr ? "/qr" : ""}`,
        {
          method,
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            Accept: "application/json",
          },
          redirect: "error",
          cache: "no-store",
          signal: AbortSignal.timeout(8000),
        },
      );
      if (qr && response.status === 409) {
        await response.body?.cancel();
        throw new IdentityError(
          "QR_NOT_READY",
          409,
          "QR belum tersedia atau sudah kedaluwarsa. Muat ulang status koneksi.",
        );
      }
      if (
        !response.ok ||
        !response.headers.get("content-type")?.includes("application/json") ||
        !response.body
      ) {
        await response.body?.cancel();
        throw unavailable();
      }
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let length = 0;
      try {
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          length += chunk.value.byteLength;
          if (length > 256 * 1024) throw unavailable();
          chunks.push(chunk.value);
        }
      } finally {
        await reader.cancel();
      }
      const body: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      if (qr) {
        const parsed = gatewayQrSchema.safeParse(body);
        if (!parsed.success || parsed.data.branchId !== branchId)
          throw unavailable();
        const expiry = Date.parse(parsed.data.expiresAt);
        if (expiry <= Date.now() || expiry > Date.now() + 5 * 60_000)
          throw new IdentityError(
            "QR_EXPIRED",
            409,
            "QR sudah kedaluwarsa atau masa berlakunya tidak valid.",
          );
        return parsed.data;
      }
      const parsed = gatewaySessionSchema.safeParse(body);
      if (!parsed.success || parsed.data.branchId !== branchId)
        throw unavailable();
      return parsed.data;
    } catch (error) {
      if (error instanceof IdentityError) throw error;
      throw unavailable();
    }
  }
  return {
    async session(branchId: number, method: "GET" | "POST" | "DELETE" = "GET") {
      return gatewaySessionSchema.parse(await request(branchId, method));
    },
    async qr(branchId: number) {
      return gatewayQrSchema.parse(await request(branchId, "GET", true));
    },
  };
}
