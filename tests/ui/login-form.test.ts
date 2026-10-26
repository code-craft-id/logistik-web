import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "../../src/features/identity/components/login-form";

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams("redirect=%2F%2Fexternal.invalid"),
}));

let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
  vi.clearAllMocks();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

async function submit() {
  await act(async () => {
    host
      .querySelector("form")
      ?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}

describe("username login form", () => {
  it("has labelled username/password controls and no email input", async () => {
    await act(async () => root.render(createElement(LoginForm)));
    expect(host.querySelector('label[for="username"]')?.textContent).toBe(
      "Username",
    );
    expect(host.querySelector('input[autocomplete="username"]')).not.toBeNull();
    expect(
      host.querySelector('input[autocomplete="current-password"]'),
    ).not.toBeNull();
    expect(host.querySelector('input[type="email"]')).toBeNull();
  });

  it("uses the username endpoint and always lands on /dashboard, not a redirect query", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetch);
    await act(async () => root.render(createElement(LoginForm)));
    await submit();
    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/sign-in/username",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ username: "", password: "" }),
      }),
    );
    expect(router.replace).toHaveBeenCalledWith("/dashboard");
    expect(router.refresh).toHaveBeenCalledOnce();
  });

  it("does not navigate on rejection and does not display provider errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await act(async () => root.render(createElement(LoginForm)));
    await submit();
    expect(host.querySelector('[role="alert"]')?.textContent).toContain(
      "Username atau password salah",
    );
    expect(router.replace).not.toHaveBeenCalled();
    expect(host.querySelector("button")?.disabled).toBe(false);
  });

  it("recovers from a network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Network failed")),
    );
    await act(async () => root.render(createElement(LoginForm)));
    await submit();
    expect(host.querySelector('[role="alert"]')?.textContent).toContain(
      "Tidak dapat terhubung",
    );
    expect(host.querySelector("button")?.disabled).toBe(false);
  });
});
