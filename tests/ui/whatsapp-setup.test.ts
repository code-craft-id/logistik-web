import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BranchWhatsAppSetupPanel } from "../../src/features/whatsapp/components/branch-whatsapp-setup";
import type { BranchWhatsAppSetup } from "../../src/features/whatsapp/contracts";

const actions = vi.hoisted(() => ({ listBranchWhatsAppSetup: vi.fn() }));
vi.mock("../../src/features/whatsapp/actions", () => actions);
const page: BranchWhatsAppSetup = {
  items: [
    { id: 1, code: "FAKE-A", name: "FAKE Branch A", officeName: "FAKE Office" },
  ],
  pagination: { page: 1, pageSize: 20, total: 21, totalPages: 2 },
  connectionAvailable: false,
  canManageConnections: false,
  gatewayConfiguration: "not_configured",
};
let root: Root, host: HTMLDivElement;
const render = () =>
  act(async () =>
    root.render(createElement(BranchWhatsAppSetupPanel, { companyId: 12 })),
  );
function button(label: string) {
  const button = [...host.querySelectorAll("button")].find(
    (element) => element.textContent === label,
  );
  if (!button) throw new Error(`Missing button ${label}`);
  return button;
}
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  actions.listBranchWhatsAppSetup
    .mockReset()
    .mockResolvedValue({ ok: true, data: page });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});
describe("WA-01 preparation panel", () => {
  it("connects the selected branch, displays its QR, refreshes status and confirms logout", async () => {
    actions.listBranchWhatsAppSetup.mockResolvedValue({
      ok: true,
      data: {
        ...page,
        connectionAvailable: true,
        canManageConnections: true,
        gatewayConfiguration: "configured",
      },
    });
    const base = { branchId: 1, phoneNumber: null };
    const transport = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ ...base, status: "disconnected" }))
      .mockResolvedValueOnce(Response.json({ ...base, status: "qr" }))
      .mockResolvedValueOnce(
        Response.json({
          branchId: 1,
          qrDataUrl: "data:image/png;base64,iVBORw0KGgoAAA==",
          expiresAt: new Date(Date.now() + 60_000).toISOString(),
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          branchId: 1,
          status: "connected",
          phoneNumber: "+6281234567890",
        }),
      )
      .mockResolvedValueOnce(
        Response.json({ ...base, status: "disconnected" }),
      );
    vi.stubGlobal("fetch", transport);
    await render();
    await act(async () => button("Periksa WhatsApp FAKE Branch A").click());
    const dialogButton = (label: string) => {
      const element = [
        ...document.querySelectorAll<HTMLButtonElement>(
          '[role="dialog"] button',
        ),
      ].find((button) => button.textContent === label);
      if (!element) throw new Error(label);
      return element;
    };
    await act(async () => dialogButton("Hubungkan nomor").click());
    expect(transport).toHaveBeenLastCalledWith(
      "/api/whatsapp/branches/1/session",
      { method: "POST", cache: "no-store" },
    );
    await act(async () => dialogButton("Tampilkan QR").click());
    expect(
      document.querySelector('[role="dialog"] img')?.getAttribute("alt"),
    ).toContain("FAKE Branch A");
    await act(async () => dialogButton("Muat status").click());
    expect(document.querySelector('[role="dialog"] img')).toBeNull();
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
      "+6281234567890",
    );
    await act(async () => dialogButton("Putuskan koneksi").click());
    expect(transport).toHaveBeenCalledTimes(4);
    await act(async () => dialogButton("Ya, putuskan").click());
    expect(transport).toHaveBeenLastCalledWith(
      "/api/whatsapp/branches/1/session",
      { method: "DELETE", cache: "no-store" },
    );
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
      "Terputus",
    );
  });
  it("shows only status controls to scoped readers", async () => {
    actions.listBranchWhatsAppSetup.mockResolvedValue({
      ok: true,
      data: {
        ...page,
        connectionAvailable: true,
        canManageConnections: false,
      },
    });
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          Response.json({ branchId: 1, status: "qr", phoneNumber: null }),
        ),
    );
    await render();
    await act(async () => button("Periksa WhatsApp FAKE Branch A").click());
    const content = document.querySelector('[role="dialog"]')?.textContent;
    expect(content).toContain("Muat status");
    expect(content).not.toContain("Tampilkan QR");
    expect(content).not.toContain("Putuskan koneksi");
  });
  it("shows loading, honest disconnected status and a keyboard-reachable table", async () => {
    let resolve!: (value: unknown) => void;
    actions.listBranchWhatsAppSetup.mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      }),
    );
    await render();
    expect(host.textContent).toContain("Memuat cabang WhatsApp");
    await act(async () => resolve({ ok: true, data: page }));
    expect(host.textContent).toContain("FAKE Branch A");
    expect(host.textContent).toContain("Gateway belum siap");
    expect(host.textContent).toContain("pesan belum dapat dikirim");
    expect(
      host
        .querySelector('[data-slot="table-container"]')
        ?.getAttribute("tabindex"),
    ).toBe("0");
    expect(host.querySelector("img")).toBeNull();
    expect(
      [...host.querySelectorAll("button")].some((element) =>
        /kirim|hubungkan|QR/i.test(element.textContent ?? ""),
      ),
    ).toBe(false);
  });
  it("keeps company scope across pagination and resets to page one on search", async () => {
    await render();
    await act(async () => button("Cabang berikutnya").click());
    expect(actions.listBranchWhatsAppSetup).toHaveBeenLastCalledWith({
      companyId: 12,
      page: 2,
      pageSize: 20,
      search: "",
    });
    const input = host.querySelector<HTMLInputElement>(
      "#whatsapp-branch-search",
    );
    if (!input) throw new Error("Missing search");
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    await act(async () => {
      setter?.call(input, "FAKE-A");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () =>
      host
        .querySelector("form")
        ?.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        ),
    );
    expect(actions.listBranchWhatsAppSetup).toHaveBeenLastCalledWith({
      companyId: 12,
      page: 1,
      pageSize: 20,
      search: "FAKE-A",
    });
  });
  it.each([
    "denied",
    "network",
  ])("recovers from %s failures with retry", async (failure) => {
    if (failure === "denied")
      actions.listBranchWhatsAppSetup.mockResolvedValueOnce({
        ok: false,
        message: "Akses ditolak",
      });
    else
      actions.listBranchWhatsAppSetup.mockRejectedValueOnce(
        new Error("FAKE private gateway"),
      );
    await render();
    expect(host.querySelector('[role="alert"]')).not.toBeNull();
    expect(host.textContent).not.toContain("private gateway");
    await act(async () => button("Muat ulang cabang").click());
    expect(host.querySelector('[role="alert"]')).toBeNull();
    expect(host.textContent).toContain("FAKE Branch A");
  });
  it("explains an empty branch list and hides administrator configuration for readers", async () => {
    actions.listBranchWhatsAppSetup.mockResolvedValue({
      ok: true,
      data: {
        ...page,
        items: [],
        gatewayConfiguration: null,
        pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
      },
    });
    await render();
    expect(host.textContent).toContain("Tidak ada cabang aktif");
    expect(host.textContent).not.toContain("Pengaturan server");
    expect(button("Cabang berikutnya").disabled).toBe(true);
  });
});
