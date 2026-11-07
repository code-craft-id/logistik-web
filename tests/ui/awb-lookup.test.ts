import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

vi.mock("@/features/bookings/lookup-actions", () => ({
  lookupTransactionAction: vi.fn(),
}));

// Mock Radix Select as native elements so onValueChange is testable in happy-dom.
vi.mock("@/components/ui/select", async () => {
  const React = await import("react");
  const Ctx = React.createContext<{
    value: string;
    onValueChange: (v: string) => void;
  }>({ value: "any", onValueChange: () => {} });
  return {
    Select: ({
      value,
      onValueChange,
      children,
    }: {
      value: string;
      onValueChange: (v: string) => void;
      children: React.ReactNode;
    }) =>
      React.createElement(
        Ctx.Provider,
        { value: { value, onValueChange } },
        React.createElement("div", { "data-select-root": true }, children),
      ),
    SelectTrigger: ({
      children,
      id,
    }: {
      children: React.ReactNode;
      id?: string;
    }) =>
      React.createElement("div", { id, "data-select-trigger": true }, children),
    SelectValue: () => null,
    SelectContent: ({ children }: { children: React.ReactNode }) => {
      const ctx = React.useContext(Ctx);
      return React.createElement(
        "select",
        {
          id: "originBranchSelectNative",
          "data-testid": "origin-branch-select",
          value: ctx.value ?? "any",
          onChange: (e: { target: { value: string } }) =>
            ctx.onValueChange(e.target.value),
        },
        children,
      );
    },
    SelectItem: ({
      value,
      children,
    }: {
      value: string;
      children: React.ReactNode;
    }) => React.createElement("option", { value }, children),
  };
});

import { AwbLookup } from "../../src/features/bookings/components/awb-lookup";
import { lookupTransactionAction } from "../../src/features/bookings/lookup-actions";

let host: HTMLDivElement;
let root: Root;

const mockLookup = lookupTransactionAction as unknown as ReturnType<
  typeof vi.fn
>;

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const singleResult = (awbNo: string, id: number) => ({
  found: true as const,
  data: {
    id,
    awbNo,
    status: "IN_TRANSIT",
    transactionDate: "2025-10-01",
    originBranchId: 1,
    destinationBranchId: 2,
    originBranch: { id: 1, code: "A", name: "Cabang A" },
    destinationBranch: { id: 2, code: "B", name: "Cabang B" },
  },
});

async function renderLookup() {
  await act(async () => {
    root.render(createElement(AwbLookup));
  });
  // Flush branch-loading effect microtasks
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function awbInput(): HTMLInputElement {
  const el = host.querySelector<HTMLInputElement>("#awbNo");
  if (!el) throw new Error("Missing AWB input");
  return el;
}

function setInputValue(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;
  if (!setter) throw new Error("Missing value setter");
  setter.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

function originSelect(): HTMLSelectElement {
  const el = host.querySelector<HTMLSelectElement>(
    '[data-testid="origin-branch-select"]',
  );
  if (!el) throw new Error("Missing origin branch select");
  return el;
}

function setSelectValue(el: HTMLSelectElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLSelectElement.prototype,
    "value",
  )?.set;
  if (!setter) throw new Error("Missing select value setter");
  setter.call(el, value);
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

async function submitForm() {
  const form = host.querySelector("form");
  if (!form) throw new Error("Missing form");
  await act(async () => {
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
    await Promise.resolve();
    await Promise.resolve();
  });
}

beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  mockLookup.mockReset();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      json: async () => ({
        branches: [
          { id: 1, code: "A", name: "Cabang A" },
          { id: 3, code: "C", name: "Cabang C" },
        ],
        isAdmin: false,
      }),
    })),
  );
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await renderLookup();
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

it("clears previous lookup result when AWB number changes (PR #9 regression)", async () => {
  mockLookup.mockResolvedValueOnce(singleResult("AWB-OLD", 101));

  setInputValue(awbInput(), "AWB-OLD");
  await submitForm();
  // Flush transition
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(host.textContent).toContain("AWB: AWB-OLD");
  expect(host.textContent).toContain("ID Transaksi: 101");

  // Change AWB input — result should be cleared immediately
  await act(async () => {
    setInputValue(awbInput(), "AWB-NEW");
  });

  expect(host.textContent).not.toContain("AWB: AWB-OLD");
  expect(host.textContent).not.toContain("ID Transaksi: 101");
});

it("ignores stale lookup responses when a newer request completes (PR #9 regression)", async () => {
  const first = deferred<ReturnType<typeof singleResult>>();
  const second = deferred<ReturnType<typeof singleResult>>();
  mockLookup
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise);

  // First search
  setInputValue(awbInput(), "AWB-FIRST");
  await submitForm();

  // Second search (newer)
  setInputValue(awbInput(), "AWB-SECOND");
  await submitForm();

  // Resolve second first
  await act(async () => {
    second.resolve(singleResult("AWB-SECOND", 202));
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(host.textContent).toContain("AWB: AWB-SECOND");
  expect(host.textContent).toContain("ID Transaksi: 202");

  // Resolve first (stale) — must not overwrite
  await act(async () => {
    first.resolve(singleResult("AWB-FIRST", 101));
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(host.textContent).toContain("AWB: AWB-SECOND");
  expect(host.textContent).toContain("ID Transaksi: 202");
  expect(host.textContent).not.toContain("AWB: AWB-FIRST");
  expect(host.textContent).not.toContain("ID Transaksi: 101");
});

it("invalidates in-flight lookup and clears stale results when origin branch changes (PR #9 regression)", async () => {
  const pending = deferred<ReturnType<typeof singleResult>>();
  mockLookup.mockReturnValueOnce(pending.promise);

  setInputValue(awbInput(), "AWB123");
  await submitForm();

  // While request is in-flight, change origin filter to branch C (id 3).
  await act(async () => {
    setSelectValue(originSelect(), "3");
    await Promise.resolve();
  });

  // UI should reflect selected branch and have no stale result rendered.
  expect(originSelect().value).toBe("3");
  expect(host.textContent).not.toContain("AWB: AWB123");
  expect(host.textContent).not.toContain("ID Transaksi: 101");

  // Resolve the in-flight (now stale) response for branch A.
  await act(async () => {
    pending.resolve(singleResult("AWB123", 101));
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
  // Flush any transition-driven state updates.
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });

  // Stale response must not repopulate results (option labels may still exist).
  expect(originSelect().value).toBe("3");
  expect(host.textContent).not.toContain("AWB: AWB123");
  expect(host.textContent).not.toContain("ID Transaksi: 101");
  expect(host.textContent).not.toContain("A - Cabang A - Cabang A"); // sanity: no duplicated stale render
  // Result card branch lines should not show Cabang A as a lookup result.
  expect(host.querySelector(".border.rounded.p-4")).toBeNull();
});
