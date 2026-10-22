import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  PreviewScreen,
  PreviewView,
} from "../../src/components/patterns/preview-contract";
import { PreviewForm } from "../../src/components/patterns/preview-form";
import { PreviewWorkspace } from "../../src/components/patterns/preview-workspace";
import { screens as accounting } from "../../src/features/accounting/preview/screens";
import { screens as identity } from "../../src/features/identity/preview/screens";
import { screens as masters } from "../../src/features/master-data/preview/screens";
import { screens as organization } from "../../src/features/organization/preview/screens";
import { screens as reports } from "../../src/features/reports/preview/screens";
import { screens as sales } from "../../src/features/sales/preview/screens";
import { screens as shipments } from "../../src/features/shipments/preview/screens";
import { screens as ticketing } from "../../src/features/ticketing/preview/screens";

const screens: PreviewScreen[] = Object.values({
  ...identity,
  ...organization,
  ...masters,
  ...sales,
  ...shipments,
  ...reports,
  ...accounting,
  ...ticketing,
});
function leaves(views: readonly PreviewView[]): PreviewView[] {
  return views.flatMap((view) => [
    ...(view.children?.length ? leaves(view.children) : [view]),
    ...leaves(view.supplementalViews ?? []),
  ]);
}
const workspaces = screens
  .filter(
    (screen) =>
      screen.kind === "workspace" &&
      !["/login", "/hak-akses-menu"].includes(screen.path),
  )
  .flatMap((screen) => leaves(screen.views).map((view) => ({ screen, view })));
let host: HTMLDivElement;
let root: Root;
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

describe("complete legacy workspace presentation coverage", () => {
  it.each(
    workspaces,
  )("renders $screen.path / $view.label with its columns and mounted form fields", async ({
    screen,
    view,
  }) => {
    await act(async () =>
      root.render(
        createElement(PreviewWorkspace, {
          screen: { ...screen, views: [{ ...view, supplementalViews: [] }] },
        }),
      ),
    );
    expect(
      Array.from(host.querySelectorAll("thead th button")).map(
        (item) => item.textContent,
      ),
    ).toEqual(view.columns.map((column) => column.label));
    expect(host.querySelector("table")?.textContent).toContain(
      "Synthetic presentation fixtures only",
    );
    expect(host.textContent).toContain("24 preview rows");
    for (const control of host.querySelectorAll("button, [role='button']")) {
      const label = control.getAttribute("aria-label") ?? control.textContent;
      expect(label, `${screen.path} / ${view.label}`).not.toMatch(
        /\b(refresh|reload(?: data)?|sync(?:hronize)?|muat ulang|segarkan)\b/i,
      );
    }
    if (view.fields.length) {
      await act(async () => root.render(createElement(PreviewForm, { view })));
      const ids = [...host.querySelectorAll("input, select, textarea")].map(
        (field) => field.id,
      );
      expect(new Set(ids).size).toBe(ids.length);
      for (const field of view.fields) {
        const control = [
          ...host.querySelectorAll("input, select, textarea"),
        ].find((control) =>
          control.id.endsWith(`-${encodeURIComponent(field.key)}`),
        );
        expect(control, `${screen.path} ${field.label}`).toBeDefined();
        expect(
          host.querySelector(`label[for="${control?.id}"]`)?.textContent,
        ).toContain(field.label);
      }
      expect(
        [...host.querySelectorAll<HTMLButtonElement>("button")].find((button) =>
          button.textContent.includes("Simpan — unavailable"),
        )?.disabled,
      ).toBe(true);
    }
  });
});
