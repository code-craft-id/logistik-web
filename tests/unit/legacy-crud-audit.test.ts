import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import screenMap from "../../docs/experiments/legacy-ui-screen-map.json";
import type { PreviewView } from "../../src/components/patterns/preview-contract";
import { screens as accounting } from "../../src/features/accounting/preview/screens";
import { screens as dashboard } from "../../src/features/dashboard/preview/screens";
import { screens as identity } from "../../src/features/identity/preview/screens";
import { screens as masters } from "../../src/features/master-data/preview/screens";
import { screens as organization } from "../../src/features/organization/preview/screens";
import { screens as reports } from "../../src/features/reports/preview/screens";
import { screens as sales } from "../../src/features/sales/preview/screens";
import { screens as shipments } from "../../src/features/shipments/preview/screens";
import { screens as ticketing } from "../../src/features/ticketing/preview/screens";

const screens = Object.values({
  ...identity,
  ...organization,
  ...masters,
  ...sales,
  ...shipments,
  ...reports,
  ...accounting,
  ...ticketing,
  ...dashboard,
});
const audit = readFileSync(
  "docs/experiments/legacy-crud-integration.md",
  "utf8",
);
function leaves(views: readonly PreviewView[]): PreviewView[] {
  return views.flatMap((view) => [
    ...(view.children?.length ? leaves(view.children) : [view]),
    ...leaves(view.supplementalViews ?? []),
  ]);
}

describe("legacy operational integration inventory", () => {
  it("accounts for every route and leaf once, including dormant and supplemental views", () => {
    expect(screens.map((screen) => screen.path).sort()).toEqual(
      screenMap.map((screen) => screen.path).sort(),
    );
    expect(screens.flatMap((screen) => leaves(screen.views))).toHaveLength(72);
    const expected = screens.flatMap((screen) => {
      const views = leaves(screen.views);
      return views.length
        ? views.map((view) => `${screen.path}#${view.id}`)
        : [`${screen.path}#screen`];
    });
    const matrix = audit
      .split("## Complete route and leaf matrix")[1]
      ?.split("## Embedded functional views")[0];
    const actual = [...(matrix ?? "").matchAll(/^\| `([^`]+)` \|/gm)].map(
      ([, key]) => key,
    );
    expect(actual.sort()).toEqual(expected.sort());
    expect(new Set(actual).size).toBe(actual.length);
  });

  it("accounts for embedded form groups and action-specific message panels", () => {
    const embedded = audit.split("## Embedded functional views")[1];
    for (const screen of screens) {
      for (const view of leaves(screen.views)) {
        for (const group of view.formGroups ?? []) {
          expect(embedded).toContain(
            `| \`${screen.path}#${view.id}\` | Create/edit tab: ${group} |`,
          );
        }
        for (const [action, form] of Object.entries(view.actionForms ?? {})) {
          for (const group of new Set(
            form.fields.map((field) => field.group),
          )) {
            if (group) expect(embedded).toContain(`${action} / ${group}`);
          }
        }
      }
    }
  });
});
