import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ImportPreview } from "../../src/components/patterns/import-preview";
import { PreviewForm } from "../../src/components/patterns/preview-form";
import { PreviewWorkspace } from "../../src/components/patterns/preview-workspace";
import { MenuAccessPreview } from "../../src/features/identity/components/menu-access-preview";
import { screens as identity } from "../../src/features/identity/preview/screens";
import { screens as masters } from "../../src/features/master-data/preview/screens";
import { screens as office } from "../../src/features/organization/preview/screens";
import { screens as reports } from "../../src/features/reports/preview/screens";
import { screens as tickets } from "../../src/features/ticketing/preview/screens";

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
  it("adds and removes local ticket pictures while saving remains unavailable", async () => {
    await act(async () =>
      root.render(
        createElement(PreviewForm, { view: tickets["/ticketting"].views[0] }),
      ),
    );
    expect(host.querySelectorAll('input[type="file"]')).toHaveLength(2);
    await act(async () => button("Tambah Gambar").click());
    expect(host.querySelectorAll('input[type="file"]')).toHaveLength(3);
    await act(async () => button("Hapus gambar 1").click());
    expect(host.querySelectorAll('input[type="file"]')).toHaveLength(2);
    expect(button("Simpan — unavailable").disabled).toBe(true);
    expect(host.querySelector('[aria-required="true"]')).not.toBeNull();
  });
  it("retains three WhatsApp message panels and sender/recipient sections without sending", async () => {
    const view = office["/office"].views
      .flatMap((view) => ("children" in view ? (view.children ?? []) : []))
      .find((view) => view.label === "WA Notifikasi");
    if (!view || !("actionForms" in view))
      throw Error("Missing WhatsApp action");
    const messageView = view.actionForms?.["Lihat Pesan WhatsApp"];
    if (!messageView) throw Error("Missing message form");
    await act(async () =>
      root.render(
        createElement(PreviewForm, {
          view: messageView,
        }),
      ),
    );
    expect(host.querySelectorAll('[role="tabpanel"]')).toHaveLength(3);
    expect(host.querySelectorAll("textarea")).toHaveLength(4);
    expect(host.textContent).toContain("Pengirim");
    expect(host.textContent).toContain("Message WA Delivery Sheet");
    expect(button("Simpan — unavailable").disabled).toBe(true);
  });
  it("preserves AR/AP aging columns and paid/unpaid detail tabs without calculating financial totals", async () => {
    await act(async () =>
      root.render(
        createElement(PreviewWorkspace, {
          screen: reports["/financial-reports"],
        }),
      ),
    );
    expect(host.querySelectorAll("table")).toHaveLength(2);
    expect(host.querySelector("table thead")?.textContent).toContain(
      "USIA FAKTUR",
    );
    expect(host.querySelector("table tfoot")?.textContent).toContain(
      "no financial totals calculated",
    );
    await act(async () =>
      button("Laporan AP").dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      ),
    );
    expect(host.querySelector("table thead")?.textContent).toContain(
      "BATAS WAKTU",
    );
    await act(async () =>
      button("Lunas").dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      ),
    );
    const tables = host.querySelectorAll("table");
    expect(tables[1].querySelector("tbody tr")?.textContent).toContain("Lunas");
    expect(tables[1].querySelector("tbody tr td:last-child")?.textContent).toBe(
      "—",
    );
    for (const control of host.querySelectorAll<HTMLButtonElement>("button"))
      if (control.textContent?.includes("Export Excel"))
        expect(control.disabled).toBe(true);
  });

  it("expands and collapses manifest report details with explicit disclosure state", async () => {
    await act(async () =>
      root.render(
        createElement(PreviewWorkspace, {
          screen: reports["/branch-reports/gross-profit"],
        }),
      ),
    );
    const detail = button("Detail");
    expect(detail.getAttribute("aria-expanded")).toBe("false");
    const panel = document.getElementById(
      detail.getAttribute("aria-controls") ?? "",
    );
    expect(panel?.hidden).toBe(true);
    await act(async () => detail.click());
    expect(detail.getAttribute("aria-expanded")).toBe("true");
    expect(panel?.hidden).toBe(false);
    expect(panel?.textContent).toContain("Rute");
    await act(async () => detail.click());
    expect(panel?.hidden).toBe(true);
  });
  it("validates only an import filename and never simulates an upload or import result", async () => {
    await act(async () => root.render(createElement(ImportPreview)));
    const input = host.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw Error("Missing import input");
    await act(async () => {
      Object.defineProperty(input, "files", {
        configurable: true,
        value: [new File([""], "fictional.txt")],
      });
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(host.querySelector('[role="alert"]')?.textContent).toContain(
      ".xlsx",
    );
    await act(async () => {
      Object.defineProperty(input, "files", {
        configurable: true,
        value: [new File([""], "fictional.xlsx")],
      });
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(host.querySelector('[role="alert"]')).toBeNull();
    expect(host.querySelector("output")?.textContent).toContain(
      "fictional.xlsx",
    );
    expect(host.querySelector("progress")?.value).toBe(0);
    expect(button("Upload — unavailable").disabled).toBe(true);
    expect(
      Array.from(host.querySelectorAll("dd")).map((e) => e.textContent),
    ).toEqual(["Unavailable", "Unavailable", "Unavailable"]);
  });

  it("opens an edit preview from its keyboard menu and restores focus without saving a row", async () => {
    await act(async () =>
      root.render(
        createElement(PreviewWorkspace, { screen: identity["/group-user"] }),
      ),
    );
    const trigger = host.querySelector<HTMLButtonElement>(
      'button[aria-haspopup="menu"]',
    );
    if (!trigger) throw Error("Missing row menu");
    trigger.focus();
    await act(async () =>
      trigger.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      ),
    );
    const edit = Array.from(
      document.querySelectorAll<HTMLElement>('[role="menuitem"]'),
    ).find((e) => e.textContent === "Edit");
    if (!edit) throw Error("Missing edit action");
    await act(async () => edit.click());
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    expect(button("Simpan — unavailable").disabled).toBe(true);
    await act(async () =>
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      ),
    );
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(host.textContent).toContain("24 preview rows");
  });
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
