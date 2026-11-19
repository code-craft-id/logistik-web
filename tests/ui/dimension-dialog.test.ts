import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  DimensionDialog,
  modeDivider,
} from "../../src/features/bookings/components/dimension-dialog";

let host: HTMLDivElement, root: Root;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});

const byLabel = (label: string) => {
  const el = document.body.querySelector<HTMLInputElement>(
    `[aria-label="${label}"]`,
  );
  if (!el) throw new Error(`missing ${label}`);
  return el;
};
async function type(label: string, value: string) {
  const el = byLabel(label);
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;
  await act(async () => {
    setter?.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
const button = (text: string) =>
  [...document.body.querySelectorAll("button")].find(
    (b) => b.textContent === text,
  ) as HTMLButtonElement;

it("reads the Moda divider text", () => {
  expect(modeDivider("4000")).toBe(4000);
  expect(modeDivider("FAKE")).toBe(0);
  expect(modeDivider(null)).toBe(0);
});

it("computes volume per koli as P x L x T / divider and applies totals", async () => {
  const onApply = vi.fn();
  await act(async () =>
    root.render(
      createElement(DimensionDialog, {
        koli: 2,
        divider: 4000,
        modeName: "DARAT",
        onApply,
      }),
    ),
  );
  await act(async () => button("Dimensi").click());
  await type("Panjang koli 1", "100");
  await type("Lebar koli 1", "50");
  await type("Tinggi koli 1", "40");
  await type("Berat koli 1", "5");
  await type("Panjang koli 2", "10");
  await type("Lebar koli 2", "10");
  await type("Tinggi koli 2", "40");
  await type("Berat koli 2", "2");
  await act(async () => byLabel("Packing koli 2").click());
  await type("Biaya packing koli 2", "15000");
  await act(async () => button("Berikutnya").click());
  expect(onApply).toHaveBeenCalledWith(
    expect.objectContaining({ volume: "51", kilo: "7", packingFee: "15000" }),
  );
});
