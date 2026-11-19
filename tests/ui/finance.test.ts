import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { CommandForm } from "../../src/features/finance/components/command-form";
import { InvoiceForm } from "../../src/features/finance/components/invoice-form";

const { save, refresh, options } = vi.hoisted(() => ({
  save: vi.fn(),
  refresh: vi.fn(),
  options: vi.fn(),
}));
vi.mock("../../src/features/finance/actions", () => ({
  financeCommand: save,
  financeOptions: options,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push: vi.fn() }),
}));
let host: HTMLDivElement, root: Root;
beforeEach(() => {
  vi.resetAllMocks();
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});
async function submit() {
  await act(async () => {
    host
      .querySelector("form")
      ?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}
/** Clicks a button of the confirmation modal (rendered in a portal). */
async function answer(text: "Batal" | "Ya") {
  await act(async () => {
    const button = [...document.body.querySelectorAll("button")].find((b) =>
      b.textContent?.startsWith(text),
    );
    if (!button) throw new Error(`modal button ${text} not found`);
    button.click();
  });
}
it("announces a failed command, retains its retry key and distinguishes confirmed success", async () => {
  save
    .mockResolvedValueOnce({ ok: false, message: "Periode tertutup." })
    .mockResolvedValueOnce({ ok: true, id: 1 });
  await act(async () =>
    root.render(
      createElement(CommandForm, {
        values: { action: "payment.reverse", id: 1 },
        label: "Balikkan pembayaran #1",
      }),
    ),
  );
  // Destructive: the modal asks first; Batal sends nothing.
  await submit();
  await answer("Batal");
  expect(save).not.toHaveBeenCalled();
  await submit();
  await answer("Ya");
  expect(host.querySelector('[role="alert"]')?.textContent).toBe(
    "Periode tertutup.",
  );
  expect(host.querySelector("button")?.getAttribute("data-variant")).toBe(
    "destructive",
  );
  await submit();
  await answer("Ya");
  expect(save.mock.calls[0][0].key).toBe(save.mock.calls[1][0].key);
  expect(host.querySelector('[role="status"]')?.textContent).toBe("Tersimpan.");
  expect(host.querySelector('[role="alert"]')).toBeNull();
  expect(refresh).toHaveBeenCalledOnce();
});
it("blocks repeated commands while pending and reports an uncertain response as an error", async () => {
  let reject!: (error: Error) => void;
  save.mockImplementation(
    () =>
      new Promise((_, fail) => {
        reject = fail;
      }),
  );
  await act(async () =>
    root.render(
      createElement(CommandForm, {
        values: { action: "invoice.issue" },
        label: "Terbitkan invoice",
      }),
    ),
  );
  await submit();
  await submit();
  expect(save).toHaveBeenCalledOnce();
  expect(host.querySelector("fieldset")?.disabled).toBe(true);
  expect(host.querySelector("form")?.getAttribute("aria-busy")).toBe("true");
  await act(async () => reject(new Error("offline")));
  expect(host.querySelector('[role="alert"]')?.textContent).toContain(
    "Hasil belum dapat dikonfirmasi",
  );
  expect(host.querySelector("fieldset")?.disabled).toBe(false);
});
it("announces lookup failures and preserves invoice fields across keyboard tab changes", async () => {
  options.mockResolvedValue({ ok: false, message: "Pilihan belum tersedia." });
  await act(async () =>
    root.render(
      createElement(InvoiceForm, {
        branches: [{ id: 1, name: "FAKE branch" }],
      }),
    ),
  );
  const lookup = host.querySelector<HTMLInputElement>("#lookup");
  expect(lookup?.getAttribute("aria-describedby")).toBe("lookup-hint");
  await act(async () =>
    Array.from(host.querySelectorAll("button"))
      .find((b) => b.textContent === "Cari pilihan")
      ?.click(),
  );
  expect(host.querySelector('[role="alert"]')?.textContent).toBe(
    "Pilihan belum tersedia.",
  );
  const date = host.querySelector<HTMLInputElement>("#invoiceDate");
  if (!date) throw new Error("Missing invoice date");
  date.value = "2026-11-15";
  const tabs = host.querySelectorAll<HTMLButtonElement>('[role="tab"]');
  await act(async () => {
    tabs[0].focus();
    tabs[0].dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
  });
  expect(document.activeElement).toBe(tabs[1]);
  expect(date.value).toBe("2026-11-15");
  expect(save).not.toHaveBeenCalled();
});
