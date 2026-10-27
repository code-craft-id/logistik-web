import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "../../src/components/shell/app-shell";
import {
  AccountMenuContent,
  type AccountSummary,
} from "../../src/features/identity/components/account-menu-content";

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }));

let root: Root;
let host: HTMLDivElement;
const account: AccountSummary = {
  name: "FAKE Operator",
  username: "fake_operator",
  groupName: "FAKE Operations",
  fullAccess: false,
};

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function open(summary = account) {
  await act(async () =>
    root.render(
      createElement(
        AppShell,
        {
          accountContent: createElement(AccountMenuContent, {
            account: summary,
          }),
        },
        "Workspace",
      ),
    ),
  );
  const trigger = host.querySelector<HTMLButtonElement>(
    '[aria-label="Menu akun"]',
  );
  if (!trigger) throw new Error("Missing account menu");
  trigger.focus();
  await act(async () =>
    trigger.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
      }),
    ),
  );
  return trigger;
}

function logoutItem() {
  const item = Array.from(
    document.querySelectorAll<HTMLElement>('[role="menuitem"]'),
  ).find((element) => element.textContent === "Keluar");
  if (!item) throw new Error("Missing sign-out item");
  return item;
}

describe("PLT-01 shell account menu", () => {
  it("shows the actual identity and group and links to the existing profile", async () => {
    await open();
    const menu = document.querySelector('[role="menu"]');
    expect(menu?.textContent).toContain("FAKE Operator");
    expect(menu?.textContent).toContain("@fake_operator");
    expect(menu?.textContent).toContain("Grup: FAKE Operations");
    expect(menu?.textContent).not.toContain("Akses penuh");
    expect(menu?.textContent).not.toContain("preview");
    expect(menu?.querySelector("a")?.getAttribute("href")).toBe("/profile");
  });

  it("shows global access only for an explicit full-access grant, not the group name", async () => {
    await open({ ...account, groupName: "Administrator" });
    expect(document.querySelector('[role="menu"]')?.textContent).not.toContain(
      "Akses penuh",
    );
    await act(async () =>
      root.render(
        createElement(
          AppShell,
          {
            accountContent: createElement(AccountMenuContent, {
              account: { ...account, fullAccess: true },
            }),
          },
          "Workspace",
        ),
      ),
    );
    expect(document.querySelector('[role="menu"]')?.textContent).toContain(
      "Akses penuh semua cabang",
    );
  });

  it("posts to provider logout and starts a fresh login document only after success", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetch);
    const replace = vi
      .spyOn(window.location, "replace")
      .mockImplementation(() => {});
    await open();
    await act(async () => logoutItem().click());
    expect(fetch).toHaveBeenCalledExactlyOnceWith("/api/auth/sign-out", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: "{}",
      cache: "no-store",
    });
    expect(replace).toHaveBeenCalledExactlyOnceWith("/login");
  });

  it("blocks duplicate submissions and profile navigation during logout", async () => {
    let resolve!: (response: { ok: boolean }) => void;
    const fetch = vi.fn().mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    vi.stubGlobal("fetch", fetch);
    const replace = vi
      .spyOn(window.location, "replace")
      .mockImplementation(() => {});
    await open();
    const item = logoutItem();
    await act(async () => {
      item.click();
      item.click();
    });
    expect(fetch).toHaveBeenCalledOnce();
    expect(document.querySelector("output")?.textContent).toBe(
      "Sedang keluar...",
    );
    expect(item.getAttribute("aria-disabled")).toBe("true");
    const profile =
      document.querySelector<HTMLAnchorElement>('[role="menu"] a');
    expect(profile?.getAttribute("aria-disabled")).toBe("true");
    expect(
      profile?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      ),
    ).toBe(false);
    expect(replace).not.toHaveBeenCalled();
    await act(async () => resolve({ ok: true }));
    expect(replace).toHaveBeenCalledOnce();
  });

  it.each([
    "rejected",
    "network",
  ])("keeps the menu open and supports retry after a %s failure without exposing internals", async (failure) => {
    const fetch = vi.fn();
    if (failure === "network") {
      fetch.mockRejectedValueOnce(new Error("FAKE token SQL failure"));
    } else {
      fetch.mockResolvedValueOnce({ ok: false });
    }
    fetch.mockResolvedValueOnce({ ok: true });
    vi.stubGlobal("fetch", fetch);
    const replace = vi
      .spyOn(window.location, "replace")
      .mockImplementation(() => {});
    await open();
    await act(async () => logoutItem().click());
    expect(document.querySelector('[role="menu"]')).not.toBeNull();
    expect(document.querySelector('[role="alert"]')?.textContent).toContain(
      "Belum berhasil keluar",
    );
    expect(document.body.textContent).not.toContain("FAKE token SQL");
    expect(logoutItem().getAttribute("aria-disabled")).not.toBe("true");
    expect(replace).not.toHaveBeenCalled();
    await act(async () => logoutItem().click());
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(replace).toHaveBeenCalledWith("/login");
  });

  it("closes with Escape and restores keyboard focus", async () => {
    const trigger = await open();
    await act(async () =>
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      ),
    );
    expect(document.querySelector('[role="menu"]')).toBeNull();
    // Radix restores focus in a deferred unmount callback.
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
  });
});
