import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PreviewForm } from "../../src/components/patterns/preview-form";
import { PreviewWorkspace } from "../../src/components/patterns/preview-workspace";
import { MenuAccessPreview } from "../../src/features/identity/components/menu-access-preview";
import { screens as identity } from "../../src/features/identity/preview/screens";
import { screens as masters } from "../../src/features/master-data/preview/screens";

let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});
const button = (label: string) => {
  const found = Array.from(document.querySelectorAll("button")).find(
    (button) =>
      button.textContent?.trim() === label ||
      button.getAttribute("aria-label") === label,
  );
  if (!found) throw Error(`Missing button ${label}`);
  return found;
};

describe("isolated legacy presentation interactions", () => {
  it("paginates, sorts, applies search explicitly and resets fixtures without mutating them", async () => {
    await act(async () =>
      root.render(
        createElement(PreviewWorkspace, { screen: identity["/group-user"] }),
      ),
    );
    expect(host.querySelectorAll("tbody tr")).toHaveLength(10);
    const first = host.querySelector("tbody tr")?.textContent;
    await act(async () => button("Next page").click());
    expect(host.querySelector("tbody tr")?.textContent).not.toBe(first);
    const search = host.querySelector<HTMLInputElement>('input[type="search"]');
    if (!search) throw Error("No search");
    await act(async () => {
      search.value = "no matching fixture";
      search.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(host.querySelectorAll("tbody tr")).toHaveLength(10);
    await act(async () =>
      host
        .querySelector("form")
        ?.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        ),
    );
    expect(host.textContent).toContain("No matching preview rows");
    await act(async () => button("Reset").click());
    expect(host.querySelectorAll("tbody tr")).toHaveLength(10);
    expect(host.textContent).toContain("24 preview rows");
    const sort = host.querySelector<HTMLButtonElement>("thead button");
    await act(async () => sort?.click());
    expect(host.querySelector('th[aria-sort="descending"]')).not.toBeNull();
  });

  it("keeps all form tabs mounted and draft values local while saving stays unavailable", async () => {
    const view = masters["/vendor"].views[0];
    await act(async () => root.render(createElement(PreviewForm, { view })));
    const field = host.querySelector<HTMLInputElement>('input[type="text"]');
    if (!field) throw Error("No name field");
    await act(async () => {
      field.value = "Fictional local value";
      field.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const tabs = host.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    await act(async () =>
      tabs[1].dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      ),
    );
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
    expect(host.querySelectorAll('[role="tabpanel"]')).toHaveLength(3);
    await act(async () =>
      tabs[0].dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      ),
    );
    expect(field.value).toBe("Fictional local value");
    expect(button("Simpan — unavailable").disabled).toBe(true);
    expect(host.textContent).toContain("No changes saved");
  });

  it("changes only the fictional rights matrix and clears it without granting permissions", async () => {
    await act(async () => root.render(createElement(MenuAccessPreview)));
    expect(host.querySelectorAll('input[type="checkbox"]')).toHaveLength(0);
    await act(async () =>
      host
        .querySelector("form")
        ?.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        ),
    );
    expect(host.querySelectorAll('input[type="checkbox"]')).toHaveLength(76);
    const checkbox = host.querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    if (!checkbox) throw Error("No checkbox");
    await act(async () => checkbox.click());
    expect(host.querySelector("output")?.textContent).toContain(
      "1 preview checkboxes selected",
    );
    expect(host.querySelector("output")?.textContent).toContain(
      "no access granted",
    );
    expect(button("Simpan — unavailable").disabled).toBe(true);
    await act(async () => button("Refresh").click());
    expect(host.querySelectorAll('input[type="checkbox"]')).toHaveLength(0);
  });
});
