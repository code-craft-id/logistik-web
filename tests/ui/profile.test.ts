import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProfilePageClient } from "../../src/app/(dashboard)/profile/profile-client";

const router = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
const profile = {
  id: 1,
  name: "FAKE User",
  username: "fake_user",
  email: "fake@example.invalid",
  image: null,
  fullAccess: false,
  group: { id: 1, name: "FAKE Viewer" },
  allowedBranches: [],
  createdAt: "2026-10-23T00:00:00Z",
};
const sessions = [
  {
    id: 12,
    isCurrent: true,
    userAgent: "FAKE Linux",
    ipAddress: "127.0.0.1",
    createdAt: profile.createdAt,
    expiresAt: profile.createdAt,
  },
  {
    id: 13,
    isCurrent: false,
    userAgent: "FAKE Windows",
    ipAddress: "127.0.0.1",
    createdAt: profile.createdAt,
    expiresAt: profile.createdAt,
  },
];
const response = (data: unknown, ok = true, status = ok ? 200 : 500) => ({
  ok,
  status,
  json: async () => data,
});
let host: HTMLDivElement;
let root: Root;
let fetchMock: ReturnType<typeof vi.fn>;
const defaultRequest = async (url: string, options?: RequestInit) => {
  if (options?.method && options.method !== "GET")
    return response({ success: true });
  return response(
    url === "/profile/api"
      ? profile
      : { items: sessions, pagination: { total: 2, totalPages: 1 } },
  );
};

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  router.refresh.mockClear();
  fetchMock = vi.fn(defaultRequest);
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const render = () =>
  act(async () => root.render(createElement(ProfilePageClient)));
function button(text: string) {
  const target = [...document.querySelectorAll("button")].find(
    (item) =>
      item.textContent?.trim() === text ||
      item.getAttribute("aria-label") === text,
  );
  if (!target) throw new Error(`Missing button: ${text}`);
  return target;
}
async function fill(id: string, value: string) {
  const input = document.getElementById(id);
  if (!(input instanceof HTMLInputElement))
    throw new Error(`Missing input: ${id}`);
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function submit() {
  await act(async () => {
    document
      .querySelector("form")
      ?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}

describe("PLT-01 existing profile frontend", () => {
  it("shows the real username/group/current-session marker without granting empty-branch HQ access", async () => {
    await render();
    expect(host.textContent).toContain("@fake_user");
    expect(host.textContent).toContain("FAKE Viewer");
    expect(host.textContent).toContain("Sesi saat ini");
    expect(host.textContent).toContain("Belum ada cabang yang ditugaskan.");
    expect(host.textContent).not.toContain("Administrator");
    expect(host.textContent).toContain("Sesi Aktif (2)");
  });

  it("saves only the display name and refreshes the shell account summary", async () => {
    await render();
    await act(async () => button("Ubah Nama").click());
    expect(document.querySelector('label[for="name"]')).not.toBeNull();
    await fill("name", "FAKE Edited");
    await submit();
    const mutation = fetchMock.mock.calls.find(
      ([, options]) => options?.method === "PATCH",
    );
    expect(mutation?.[0]).toBe("/profile/api");
    expect(JSON.parse(String(mutation?.[1]?.body))).toEqual({
      name: "FAKE Edited",
    });
    expect(router.refresh).toHaveBeenCalledOnce();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(host.textContent).toContain("Nama profil berhasil diperbarui.");
  });

  it("uses labelled bounded password fields and returns to login after a successful change", async () => {
    const replace = vi
      .spyOn(window.location, "replace")
      .mockImplementation(() => {});
    await render();
    await act(async () => button("Ubah Password").click());
    for (const id of ["currentPassword", "newPassword", "confirmPassword"]) {
      expect(document.querySelector(`label[for="${id}"]`)).not.toBeNull();
      expect(document.getElementById(id)?.getAttribute("maxlength")).toBe(
        "128",
      );
    }
    expect(
      document.getElementById("currentPassword")?.getAttribute("autocomplete"),
    ).toBe("current-password");
    expect(
      document.getElementById("newPassword")?.getAttribute("autocomplete"),
    ).toBe("new-password");
    await fill("currentPassword", "FAKE old password");
    await fill("newPassword", "FAKE next password");
    await fill("confirmPassword", "FAKE next password");
    await submit();
    expect(
      fetchMock.mock.calls.some(
        ([url, options]) =>
          url === "/profile/api/password" && options?.method === "POST",
      ),
    ).toBe(true);
    expect(replace).toHaveBeenCalledExactlyOnceWith("/login");
  });

  it("clears secret fields on Escape and restores focus to the initiating control", async () => {
    await render();
    const trigger = button("Ubah Password");
    trigger.focus();
    await act(async () => trigger.click());
    await fill("currentPassword", "FAKE temporary secret");
    await act(async () =>
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      ),
    );
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    await act(async () => trigger.click());
    expect(
      (document.getElementById("currentPassword") as HTMLInputElement).value,
    ).toBe("");
  });

  it("confirms other-device revocation without sending a current-session ID", async () => {
    await render();
    await act(async () => button("Cabut Sesi Lain").click());
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
      "Sesi perangkat ini tetap aktif",
    );
    expect(
      fetchMock.mock.calls.some(([, options]) => options?.method === "POST"),
    ).toBe(false);
    await act(async () => button("Ya, Cabut Sesi").click());
    const mutation = fetchMock.mock.calls.find(
      ([, options]) => options?.method === "POST",
    );
    expect(mutation?.[0]).toBe("/profile/api/sessions");
    expect(JSON.parse(String(mutation?.[1]?.body))).toEqual({
      scope: "others",
    });
    expect(host.textContent).toContain("Sesi berhasil dicabut.");
  });

  it("warns that all-device revocation includes this device and navigates to login", async () => {
    fetchMock.mockImplementation((url: string, options?: RequestInit) =>
      options?.method === "POST"
        ? Promise.resolve(response({ success: true, reauthenticate: true }))
        : defaultRequest(url, options),
    );
    const replace = vi
      .spyOn(window.location, "replace")
      .mockImplementation(() => {});
    await render();
    await act(async () => button("Keluar dari Semua Perangkat").click());
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
      "perangkat ini juga akan dicabut",
    );
    await act(async () => button("Ya, Cabut Sesi").click());
    expect(replace).toHaveBeenCalledWith("/login");
    const mutation = fetchMock.mock.calls.find(
      ([, options]) => options?.method === "POST",
    );
    expect(JSON.parse(String(mutation?.[1]?.body))).toEqual({ scope: "all" });
  });

  it("revokes the selected other session and preserves an accessible retry on failure", async () => {
    let rejected = true;
    fetchMock.mockImplementation((url: string, options?: RequestInit) =>
      options?.method === "DELETE" && rejected
        ? Promise.resolve(response({ message: "Gagal mencabut sesi." }, false))
        : defaultRequest(url, options),
    );
    await render();
    await act(async () => button("Cabut sesi").click());
    await act(async () => button("Ya, Cabut Sesi").click());
    expect(document.querySelector('[role="alert"]')?.textContent).toContain(
      "Gagal mencabut",
    );
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    rejected = false;
    await act(async () => button("Ya, Cabut Sesi").click());
    expect(
      fetchMock.mock.calls.filter(
        ([url, options]) =>
          url === "/profile/api/sessions/13" && options?.method === "DELETE",
      ),
    ).toHaveLength(2);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it("shows a retryable session-load error without hiding the rest of the profile", async () => {
    let rejected = true;
    fetchMock.mockImplementation((url: string, options?: RequestInit) =>
      url.includes("/sessions") && rejected
        ? Promise.resolve(response({ message: "Gagal memuat sesi." }, false))
        : defaultRequest(url, options),
    );
    await render();
    expect(host.textContent).toContain("@fake_user");
    expect(host.textContent).toContain("Gagal memuat sesi.");
    rejected = false;
    await act(async () => button("Coba Muat Sesi Lagi").click());
    expect(host.textContent).toContain("Sesi saat ini");
  });

  it("paginates sessions without repeatedly reloading the profile", async () => {
    fetchMock.mockImplementation((url: string, options?: RequestInit) =>
      url.includes("/sessions")
        ? Promise.resolve(
            response({
              items: sessions,
              pagination: { total: 30, totalPages: 2 },
            }),
          )
        : defaultRequest(url, options),
    );
    await render();
    await act(async () => button("Berikutnya").click());
    expect(
      fetchMock.mock.calls.some(
        ([url]) => url === "/profile/api/sessions?page=2",
      ),
    ).toBe(true);
    expect(
      fetchMock.mock.calls.filter(([url]) => url === "/profile/api"),
    ).toHaveLength(1);
  });

  it("redirects an expired session to login instead of displaying protected data", async () => {
    fetchMock.mockResolvedValue(
      response({ message: "Silakan masuk kembali." }, false, 401),
    );
    const replace = vi
      .spyOn(window.location, "replace")
      .mockImplementation(() => {});
    await render();
    expect(replace).toHaveBeenCalledWith("/login");
    expect(host.textContent).not.toContain("@fake_user");
  });
});
