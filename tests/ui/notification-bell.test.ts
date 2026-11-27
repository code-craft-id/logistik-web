import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { NotificationBell } from "../../src/features/modul/components/notification-bell";

let path = "/a";
vi.mock("next/navigation", () => ({ usePathname: () => path }));
const action = vi.fn();
vi.mock("../../src/features/modul/notification-actions", () => ({
  pendingApprovalsAction: () => action(),
}));

afterEach(() => vi.unstubAllGlobals());

it("keeps a result that arrives after navigation and does not refetch within 15 s", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  let resolve!: (value: object) => void;
  action.mockReturnValue(new Promise((done) => (resolve = done)));
  const host = document.createElement("div");
  const root = createRoot(host);
  await act(async () => root.render(createElement(NotificationBell)));
  path = "/b";
  await act(async () => root.render(createElement(NotificationBell)));
  await act(async () => resolve({ awbChanges: 2, podReturns: 1 }));
  expect(action).toHaveBeenCalledOnce();
  expect(host.textContent).toContain("3");
  await act(async () => root.unmount());
});
