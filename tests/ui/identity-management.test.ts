import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UserGroupPageClient } from "../../src/app/(dashboard)/group-user/user-group-client";
import { PermissionMatrixPageClient } from "../../src/app/(dashboard)/hak-akses-menu/permission-matrix-client";
import { ProfilePageClient } from "../../src/app/(dashboard)/profile/profile-client";
import { UserManagementPageClient } from "../../src/app/(dashboard)/user-management/user-management-client";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("groupId=2"),
  useRouter: () => ({ refresh: vi.fn() }),
}));
const capabilities = {
  create: true,
  update: true,
  delete: true,
  administrator: true,
};
const group = {
  id: 2,
  name: "FAKE Viewer",
  description: "FAKE role",
  status: "ACTIVE",
  createdAt: "2026-10-23T00:00:00Z",
  _count: { users: 1, permissions: 1 },
};
const member = {
  id: 10,
  name: "FAKE User",
  username: "fake_user",
  email: "fake@example.invalid",
  status: "ACTIVE",
  fullAccess: false,
  canAccess: true,
  createdAt: group.createdAt,
  group: { id: 2, name: group.name },
  allowedBranches: [],
};
const matrix = {
  resources: [
    { resource: "user", label: "Manajemen User", actions: ["view", "create"] },
  ],
  groups: [
    {
      group: { id: 2, name: group.name, userCount: 1 },
      permissions: { user: { view: true, create: false } },
    },
  ],
};
let root: Root;
let host: HTMLDivElement;
let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  fetchMock = vi
    .fn()
    .mockImplementation(async (url: string, options?: RequestInit) => {
      if (options?.method && options.method !== "GET")
        return { ok: true, json: async () => ({ success: true }) };
      const data = url.startsWith("/group-user/api")
        ? { items: [group], pagination: { total: 1, totalPages: 1 } }
        : url.startsWith("/user-management/api?")
          ? { items: [member], pagination: { total: 1, totalPages: 1 } }
          : url.startsWith("/user-management/api/groups")
            ? [{ id: 2, name: group.name }]
            : url.startsWith("/user-management/api/branches")
              ? [
                  {
                    id: 3,
                    code: "FAKE",
                    name: "FAKE Branch",
                    office: { name: "FAKE Office" },
                  },
                ]
              : url === "/profile/api"
                ? { ...member, image: null }
                : url.startsWith("/profile/api/sessions")
                  ? { items: [], pagination: { total: 0, totalPages: 1 } }
                  : matrix;
      return { ok: true, json: async () => data };
    });
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});
function button(text: string) {
  const result = [...document.querySelectorAll("button")].find(
    (entry) =>
      entry.textContent?.trim() === text ||
      entry.getAttribute("aria-label") === text,
  );
  if (!result) throw new Error(`Missing button ${text}`);
  return result;
}
describe("existing identity frontend wired to persistent data", () => {
  it.each([
    { Component: UserManagementPageClient, label: "Tambah User" },
    { Component: UserGroupPageClient, label: "Tambah Grup" },
  ])("restores keyboard focus to $label after cancelling its dialog", async ({
    Component,
    label,
  }) => {
    await act(async () =>
      root.render(createElement(Component, { capabilities })),
    );
    const trigger = button(label);
    await act(async () => {
      trigger.focus();
      trigger.click();
    });
    await act(async () => button("Batal").click());
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
    expect(document.activeElement).toBe(trigger);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
  it("retains selected branches while paging remote assignment options", async () => {
    const original = fetchMock.getMockImplementation() as
      | ((url: string, options?: RequestInit) => Promise<unknown>)
      | undefined;
    fetchMock.mockImplementation(async (url: string, options?: RequestInit) => {
      if (url.startsWith("/user-management/api/branches")) {
        const page = Number(
          new URL(url, "http://localhost").searchParams.get("page"),
        );
        return {
          ok: true,
          json: async () =>
            Array.from({ length: page === 1 ? 50 : 1 }, (_, index) => ({
              id: (page - 1) * 50 + index + 1,
              name: `FAKE Branch ${(page - 1) * 50 + index + 1}`,
              code: `FAKE${(page - 1) * 50 + index + 1}`,
              office: { name: "FAKE Office" },
            })),
        };
      }
      return original?.(url, options);
    });
    await act(async () =>
      root.render(createElement(UserManagementPageClient, { capabilities })),
    );
    await act(async () => button("Edit user").click());
    let choices = document.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    expect(choices).toHaveLength(50);
    await act(async () => choices[0].click());
    await act(async () => button("Berikutnya").click());
    choices = document.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    expect(choices).toHaveLength(1);
    await act(async () => choices[0].click());
    await act(async () => button("Sebelumnya").click());
    expect(
      document.querySelector<HTMLInputElement>('input[type="checkbox"]')
        ?.checked,
    ).toBe(true);
    await act(async () =>
      document
        .querySelector("form")
        ?.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        ),
    );
    const mutation = fetchMock.mock.calls.find(
      ([, options]) => options?.method === "PATCH",
    );
    expect(JSON.parse(String(mutation?.[1]?.body)).branchIds).toEqual([1, 51]);
  }, 30_000);
  it("explains administrator restrictions without changing the configured grants", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        ...matrix,
        resources: [
          ...matrix.resources,
          {
            resource: "company",
            label: "Perusahaan",
            actions: ["view", "create"],
          },
        ],
      }),
    });
    await act(async () =>
      root.render(createElement(PermissionMatrixPageClient, { capabilities })),
    );
    expect(host.textContent).toContain(
      "Tambah, ubah, dan hapus khusus administrator.",
    );
    expect(
      fetchMock.mock.calls.some(([, options]) => options?.method === "PATCH"),
    ).toBe(false);
  });
  it("shows the configured role on profile without treating unassigned branches as HQ", async () => {
    await act(async () => root.render(createElement(ProfilePageClient)));
    expect(host.textContent).toContain("FAKE Viewer");
    expect(host.textContent).toContain("Belum ada cabang yang ditugaskan");
    expect(host.textContent).not.toContain("Akses penuh (HQ/Administrator)");
    expect(
      fetchMock.mock.calls.filter(([url]) => url === "/profile/api"),
    ).toHaveLength(1);
  });
  it("loads groups automatically once and links their permission editor", async () => {
    await act(async () =>
      root.render(createElement(UserGroupPageClient, { capabilities })),
    );
    expect(host.textContent).toContain(group.name);
    expect(
      fetchMock.mock.calls.filter(([url]) => url.startsWith("/group-user/api")),
    ).toHaveLength(1);
    expect(
      host.querySelector('a[href="/hak-akses-menu?groupId=2"]'),
    ).not.toBeNull();
    await act(async () => button("Edit grup").click());
    expect(document.querySelector("input#name")).not.toBeNull();
    expect(document.querySelector('label[for="name"]')).not.toBeNull();
  });
  it("shows inherited group, treats no branches as unassigned and omits a blank edit password", async () => {
    await act(async () =>
      root.render(createElement(UserManagementPageClient, { capabilities })),
    );
    expect(host.textContent).toContain("fake_user");
    expect(host.textContent).toContain("FAKE Viewer");
    expect(host.textContent).toContain("Belum ditugaskan");
    expect(host.textContent).not.toContain("Semua (HQ)");
    expect(
      fetchMock.mock.calls.filter(([url]) =>
        url.startsWith("/user-management/api?"),
      ),
    ).toHaveLength(1);
    await act(async () => button("Edit user").click());
    expect(document.querySelector("input#username")).not.toBeNull();
    await act(async () =>
      document
        .querySelector("form")
        ?.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        ),
    );
    const mutation = fetchMock.mock.calls.find(
      ([, options]) => options?.method === "PATCH",
    );
    expect(mutation?.[0]).toBe("/user-management/api/10");
    const payload = JSON.parse(String(mutation?.[1]?.body));
    expect(payload.groupId).toBe(2);
    expect(payload).not.toHaveProperty("password");
    expect(payload).not.toHaveProperty("role");
  });
  it("loads configurable group rights without Refresh and saves a changed action", async () => {
    await act(async () =>
      root.render(createElement(PermissionMatrixPageClient, { capabilities })),
    );
    expect(host.textContent).not.toContain("Refresh");
    const create = document.querySelector<HTMLButtonElement>(
      '[aria-label="Tambah Manajemen User — FAKE Viewer"]',
    );
    expect(create).not.toBeNull();
    await act(async () => create?.click());
    await act(async () => button("Simpan Perubahan").click());
    const mutation = fetchMock.mock.calls.find(
      ([, options]) => options?.method === "PATCH",
    );
    expect(JSON.parse(String(mutation?.[1]?.body))).toEqual({
      groupId: 2,
      permissions: [
        { resource: "user", action: "view", granted: true },
        { resource: "user", action: "create", granted: true },
      ],
    });
  });
  it("does not show mutation controls to a read-only group", async () => {
    await act(async () => root.render(createElement(UserGroupPageClient)));
    expect(
      [...host.querySelectorAll("button")].some((entry) =>
        entry.textContent?.includes("Tambah Grup"),
      ),
    ).toBe(false);
    expect(button("Edit grup").disabled).toBe(true);
    expect(button("Hapus grup").disabled).toBe(true);
  });
});
