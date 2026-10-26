import { describe, expect, it, vi } from "vitest";
import { createWhatsAppGateway } from "../../src/features/whatsapp/server/gateway";

const config = () => ({
  state: "configured" as const,
  url: "https://gateway.example.invalid/tenant-a/",
  apiKey: "FAKE-PRIVATE-KEY-32-CHARACTERS-MINIMUM",
});
const session = { branchId: 7, status: "disconnected", phoneNumber: null };
describe("WA-01 gateway contract", () => {
  it("uses scoped routes, server auth, no cache, redirects or automatic retries", async () => {
    const transport = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => Response.json(session));
    const gateway = createWhatsAppGateway(config, transport);
    for (const method of ["GET", "POST", "DELETE"] as const) {
      expect(await gateway.session(7, method)).toEqual(session);
      expect(transport).toHaveBeenLastCalledWith(
        "https://gateway.example.invalid/tenant-a/v1/branches/7/session",
        expect.objectContaining({
          method,
          redirect: "error",
          cache: "no-store",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${config().apiKey}`,
          },
        }),
      );
    }
    expect(transport).toHaveBeenCalledTimes(3);
  });
  it("fails closed before any request without valid configuration", async () => {
    const transport = vi.fn<typeof fetch>();
    const gateway = createWhatsAppGateway(
      () => ({ state: "not_configured" }),
      transport,
    );
    await expect(gateway.session(7)).rejects.toMatchObject({ status: 503 });
    expect(transport).not.toHaveBeenCalled();
  });
  it.each([
    () => Response.json({ ...session, branchId: 8 }),
    () => Response.json({ ...session, status: "unknown" }),
    () => Response.json({ ...session, status: "connected" }),
    () => Response.json({ ...session, token: "PRIVATE" }),
    () => new Response("PRIVATE", { status: 401 }),
    () => new Response("PRIVATE", { status: 503 }),
    () => new Response("PRIVATE", { headers: { "content-type": "text/html" } }),
    () =>
      new Response("x".repeat(256 * 1024 + 1), {
        headers: { "content-type": "application/json" },
      }),
  ])("sanitizes invalid and cross-branch responses (%#)", async (response) => {
    const transport = vi.fn<typeof fetch>().mockResolvedValue(response());
    await expect(
      createWhatsAppGateway(config, transport).session(7),
    ).rejects.toMatchObject({ code: "GATEWAY_UNAVAILABLE", status: 502 });
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it("sanitizes timeout/network errors without exposing URLs or keys", async () => {
    const transport = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Error(`PRIVATE ${config().apiKey}`));
    await expect(
      createWhatsAppGateway(config, transport).session(7),
    ).rejects.toThrow("Server WhatsApp tidak dapat dihubungi");
  });
  it("accepts only a short-lived PNG QR belonging to the requested branch", async () => {
    const qr = {
      branchId: 7,
      qrDataUrl: "data:image/png;base64,iVBORw0KGgoAAA==",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    };
    const transport = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json(qr))
      .mockResolvedValueOnce(
        Response.json({ ...qr, expiresAt: new Date(0).toISOString() }),
      )
      .mockResolvedValueOnce(Response.json({ ...qr, branchId: 8 }))
      .mockResolvedValueOnce(new Response(null, { status: 409 }));
    const gateway = createWhatsAppGateway(config, transport);
    expect(await gateway.qr(7)).toEqual(qr);
    await expect(gateway.qr(7)).rejects.toMatchObject({ code: "QR_EXPIRED" });
    await expect(gateway.qr(7)).rejects.toMatchObject({ status: 502 });
    await expect(gateway.qr(7)).rejects.toMatchObject({ code: "QR_NOT_READY" });
  });
});
