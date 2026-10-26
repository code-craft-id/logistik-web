import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET as qrGet } from "../../src/app/api/whatsapp/branches/[branchId]/session/qr/route";
import {
  DELETE,
  GET,
  POST,
} from "../../src/app/api/whatsapp/branches/[branchId]/session/route";
import { IdentityError } from "../../src/features/identity/server/access";

const service = vi.hoisted(() => ({
  status: vi.fn(),
  change: vi.fn(),
  qr: vi.fn(),
}));
vi.mock("../../src/features/whatsapp/server/context", () => ({
  whatsappConnectionService: service,
}));
const context = { params: Promise.resolve({ branchId: "7" }) };
const request = (method: string, origin = "http://localhost:3000") =>
  new Request("http://localhost:3000/api/whatsapp/branches/7/session", {
    method,
    headers: { Origin: origin },
  });
beforeEach(() => {
  vi.resetAllMocks();
});
describe("WA-01 private HTTP boundary", () => {
  it("keeps session/QR responses uncached and checks origin on mutations and QR", async () => {
    service.status.mockResolvedValue({
      branchId: 7,
      status: "disconnected",
      phoneNumber: null,
    });
    expect(
      (await GET(request("GET"), context)).headers.get("cache-control"),
    ).toBe("private, no-store");
    for (const handler of [POST, DELETE, qrGet]) {
      expect(
        (
          await handler(
            request(
              handler === qrGet ? "GET" : handler === POST ? "POST" : "DELETE",
              "https://external.invalid",
            ),
            context,
          )
        ).status,
      ).toBe(403);
    }
    expect(service.change).not.toHaveBeenCalled();
    expect(service.qr).not.toHaveBeenCalled();
    await POST(request("POST"), context);
    await DELETE(request("DELETE"), context);
    expect(service.change.mock.calls).toEqual([
      ["7", "POST"],
      ["7", "DELETE"],
    ]);
    await qrGet(request("GET"), context);
    expect(service.qr).toHaveBeenCalledWith("7");
  });
  it("preserves authentication failures and sanitizes unexpected errors", async () => {
    service.status.mockRejectedValueOnce(
      new IdentityError("UNAUTHENTICATED", 401),
    );
    expect((await GET(request("GET"), context)).status).toBe(401);
    service.status.mockRejectedValueOnce(new Error("PRIVATE apiKey"));
    const response = await GET(request("GET"), context);
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("PRIVATE");
  });
});
