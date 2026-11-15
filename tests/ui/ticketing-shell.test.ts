import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AppShell } from "../../src/components/shell/app-shell";

const route = vi.hoisted(() => ({ pathname: "/ticketting" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});
it.each([
  "/ticketting",
  "/ticketting/new",
  "/ticketting/123",
])("identifies persisted ticket route %s as operational rather than promising no saves", async (pathname) => {
  route.pathname = pathname;
  await act(async () =>
    root.render(createElement(AppShell, null, "Ticket content")),
  );
  const footer = host.querySelector("footer")?.textContent;
  expect(footer).toContain("Perubahan data dicatat");
  expect(footer).not.toContain("No operational records loaded or saved");
});
it("keeps the synthetic example disclaimer on example routes", async () => {
  route.pathname = "/ui-examples";
  await act(async () =>
    root.render(createElement(AppShell, null, "Example content")),
  );
  expect(host.querySelector("footer")?.textContent).toContain(
    "Presentation preview",
  );
});
