import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FoundationExamples } from "../../src/components/examples/foundation-examples";
import { VendorFormExample } from "../../src/components/examples/vendor-form-example";
import { AppShell, Navigation } from "../../src/components/shell/app-shell";
import { navigation } from "../../src/components/shell/navigation";

vi.mock("next/navigation", () => ({ usePathname: () => "/ui-examples" }));

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

function button(name: string) {
  const target = Array.from(document.querySelectorAll("button")).find(
    (element) =>
      element.getAttribute("aria-label") === name ||
      element.textContent === name,
  );
  if (!target) throw new Error(`Button not found: ${name}`);
  return target;
}

describe("FND-03 local interaction contracts", () => {
  it("keeps the active route named when the sidebar collapses and restores domain labels on expansion", async () => {
    await act(async () =>
      root.render(createElement(AppShell, null, "Example content")),
    );
    await act(async () => button("Collapse sidebar").click());
    expect(button("Expand sidebar").getAttribute("aria-expanded")).toBe(
      "false",
    );
    const current = container.querySelector(
      'nav[aria-label="Main navigation"] [aria-current="page"]',
    );
    expect(current?.textContent).toBe("UI examples");
    expect(current?.getAttribute("href")).toBe("/ui-examples");
    await act(async () => button("Expand sidebar").click());
    expect(container.textContent).toContain("Master Data");
    expect(
      container.querySelectorAll('nav[aria-label="Main navigation"] a'),
    ).toHaveLength(2);
  });

  it("associates local validation feedback and moves focus to the invalid field", async () => {
    await act(async () => root.render(createElement(FoundationExamples)));
    await act(async () =>
      container
        .querySelector("form")
        ?.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        ),
    );
    const field = container.querySelector<HTMLInputElement>("#example-name");
    expect(field?.getAttribute("aria-invalid")).toBe("true");
    expect(field?.getAttribute("aria-describedby")).toContain(
      "example-name-error",
    );
    expect(
      container.querySelector("#example-name-error")?.textContent,
    ).toContain("Enter an example name");
    expect(document.activeElement).toBe(field);
  });

  it("switches simulated states and recovers without losing the example rows", async () => {
    await act(async () => root.render(createElement(FoundationExamples)));
    const select = container.querySelector<HTMLSelectElement>("#example-state");
    if (!select) throw new Error("State selector missing");
    for (const state of ["Loading", "Empty", "Error"]) {
      await act(async () => {
        select.value = state;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });
      expect(container.querySelector("table")).toBeNull();
      expect(container.textContent).toContain(`${state} state preview`);
    }
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      "simulated error",
    );
    await act(async () => button("Return to examples").click());
    expect(container.querySelectorAll("tbody tr")).toHaveLength(5);
    expect(select.value).toBe("Rows");
  });

  it("dismisses a dialog with Escape and restores focus to its trigger", async () => {
    await act(async () => root.render(createElement(FoundationExamples)));
    const trigger = button("Inspect example dialog");
    trigger.focus();
    await act(async () => trigger.click());
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    await act(async () => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
  it("preserves every provider leaf behind two disclosure levels with no operational links", async () => {
    await act(async () =>
      root.render(createElement(AppShell, null, "Example content")),
    );
    const nav = container.querySelector('nav[aria-label="Main navigation"]');
    expect(navigation[0].label).toBe("Dashboard");
    expect(
      navigation.flatMap(
        (group) => group.sections?.flatMap((section) => section.items) ?? [],
      ),
    ).toHaveLength(68);
    expect(nav?.querySelectorAll("button[aria-expanded]")).toHaveLength(22);
    for (const group of navigation) {
      for (const section of group.sections ?? []) {
        for (const leaf of section.items) {
          expect(nav?.textContent).toContain(leaf.providerLabel);
          expect(leaf.href).toBeUndefined();
        }
      }
    }
    expect(nav?.textContent).toContain("Layanan Pelanggan / Transaksi");
    expect(nav?.textContent).toContain("Onsite Outbound");
    expect(
      Array.from(nav?.querySelectorAll("a") ?? []).map((a) =>
        a.getAttribute("href"),
      ),
    ).toEqual(["/", "/ui-examples"]);
  });

  it("opens only one group and section at a time and keeps their controlled lists hidden otherwise", async () => {
    await act(async () =>
      root.render(createElement(AppShell, null, "Example content")),
    );
    const panel = (name: string) => {
      const control = button(name);
      return document.getElementById(
        control.getAttribute("aria-controls") ?? "",
      );
    };
    expect(panel("Master Data")?.hidden).toBe(true);
    await act(async () => button("Master Data").click());
    expect(panel("Master Data")?.hidden).toBe(false);
    await act(async () => button("M. Logistik / Area Logistik5").click());
    expect(panel("M. Logistik / Area Logistik5")?.hidden).toBe(false);
    await act(async () => button("M. Logistik / Kendaraan Logistik3").click());
    expect(panel("M. Logistik / Area Logistik5")?.hidden).toBe(true);
    expect(panel("M. Logistik / Kendaraan Logistik3")?.hidden).toBe(false);
    await act(async () => button("Modul").click());
    expect(panel("Master Data")?.hidden).toBe(true);
    expect(panel("Modul")?.hidden).toBe(false);
    await act(async () => button("Modul").click());
    expect(panel("Modul")?.hidden).toBe(true);
  });

  it("opens and names a complete active path on first render without creating domain routes", async () => {
    await act(async () =>
      root.render(
        createElement(Navigation, {
          groups: [
            {
              label: "Example group",
              providerLabel: "Example group",
              sections: [
                {
                  label: "Example section",
                  providerPath: ["Example parent", "Example section"],
                  items: [
                    {
                      label: "UI examples",
                      providerLabel: "UI examples",
                      href: "/ui-examples",
                    },
                  ],
                },
              ],
            },
          ],
        }),
      ),
    );
    expect(container.textContent).toContain(
      "Example group / Example parent / Example section / UI examples",
    );
    const controls = container.querySelectorAll('button[aria-expanded="true"]');
    expect(controls).toHaveLength(2);
    for (const control of controls) {
      expect(
        document.getElementById(control.getAttribute("aria-controls") ?? "")
          ?.hidden,
      ).toBe(false);
    }
    expect(
      container.querySelector('[aria-current="page"]')?.getAttribute("href"),
    ).toBe("/ui-examples");
  });

  it("keeps tab fields mounted, relates panels, toggles status, and submits only local feedback", async () => {
    await act(async () => root.render(createElement(VendorFormExample)));
    const tabs = Array.from(
      container.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    );
    expect(tabs).toHaveLength(3);
    const name = container.querySelector<HTMLInputElement>("#vendor-name");
    if (!name) throw new Error("Vendor name missing");
    name.value = "Synthetic changed value";
    const selectTab = async (index: number) =>
      act(async () => {
        tabs[index].dispatchEvent(
          new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
        );
      });
    await selectTab(1);
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
    const panel = document.getElementById(
      tabs[1].getAttribute("aria-controls") ?? "",
    );
    expect(panel?.getAttribute("aria-labelledby")).toBe(tabs[1].id);
    expect(container.querySelectorAll('[role="tabpanel"]')).toHaveLength(3);
    await selectTab(0);
    expect(name.value).toBe("Synthetic changed value");
    const toggle =
      container.querySelector<HTMLButtonElement>('[role="switch"]');
    await act(async () => toggle?.click());
    expect(toggle?.getAttribute("aria-checked")).toBe("false");
    await act(async () =>
      container
        .querySelector("form")
        ?.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        ),
    );
    expect(container.querySelector("output")?.textContent).toContain(
      "Nothing was saved",
    );
    expect(container.querySelector('[aria-invalid="true"]')).toBeNull();
  });

  it("finds provider and English labels with full paths, keeps unavailable results unlinked, and clears an empty search", async () => {
    await act(async () =>
      root.render(createElement(AppShell, null, "Example content")),
    );
    const search = container.querySelector<HTMLInputElement>(
      'input[type="search"]',
    );
    if (!search) throw new Error("Menu search missing");
    const searchFor = async (value: string) =>
      act(async () => {
        search.value = value;
        search.dispatchEvent(new Event("input", { bubbles: true }));
      });
    for (const value of ["Rekap Omset Harian", "daily turnover summary"]) {
      await searchFor(value);
      expect(container.querySelector("output")?.textContent).toContain(
        "1 matching item",
      );
      const results = document.getElementById(
        search.getAttribute("aria-controls") ?? "",
      );
      expect(results?.textContent).toContain(
        "Laporan-laporan / Laporan Cabang",
      );
      expect(results?.textContent).toContain("Rekap Omset Harian");
      expect(results?.querySelector("a")).toBeNull();
    }
    await searchFor("Sistem Seting");
    expect(container.querySelector("output")?.textContent).toBe(
      "1 matching item",
    );
    expect(
      container.querySelectorAll('nav[aria-label="Main navigation"] a'),
    ).toHaveLength(0);
    await searchFor("no-such-observed-menu");
    expect(container.textContent).toContain("No matching items");
    await act(async () => button("Clear menu search").click());
    expect(search.value).toBe("");
    expect(document.activeElement).toBe(search);
    expect(button("Master Data").getAttribute("aria-expanded")).toBe("false");
  });
});
