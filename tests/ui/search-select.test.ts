import { act, createElement, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { SearchSelect } from "../../src/components/patterns/search-select";

let host: HTMLDivElement, root: Root;
const searchChanged = vi.fn();
function Harness({
  loading = false,
  error = "",
}: {
  loading?: boolean;
  error?: string;
}) {
  const [value, setValue] = useState("12");
  const [label, setLabel] = useState("FAKE Jakarta");
  const [search, setSearch] = useState("");
  return createElement(
    "form",
    {},
    createElement(SearchSelect, {
      id: "branch",
      name: "branchId",
      label: "Cabang",
      value,
      selectedLabel: label,
      options: [
        { id: 12, name: "FAKE Jakarta" },
        { id: 23, name: "FAKE Bandung" },
      ],
      search,
      loading,
      error,
      onSearchChange: (text) => {
        searchChanged(text);
        setSearch(text);
      },
      onValueChange: (id, name) => {
        setValue(id);
        setLabel(name);
      },
    }),
  );
}
beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  searchChanged.mockReset();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(createElement(Harness, {})));
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
const input = () => {
  const element = host.querySelector<HTMLInputElement>('[role="combobox"]');
  if (!element) throw new Error("Missing combobox");
  return element;
};
const key = (value: string) =>
  input().dispatchEvent(
    new KeyboardEvent("keydown", {
      key: value,
      bubbles: true,
      cancelable: true,
    }),
  );
it("uses one searchable input and submits the selected ID, supporting keyboard selection and Escape", async () => {
  expect(host.querySelectorAll('input:not([type="hidden"])')).toHaveLength(1);
  expect(input().value).toBe("FAKE Jakarta");
  await act(async () => key("ArrowDown"));
  await act(async () => key("ArrowDown"));
  await act(async () => key("Enter"));
  expect(
    new FormData(host.querySelector("form") as HTMLFormElement).get("branchId"),
  ).toBe("23");
  expect(input().value).toBe("FAKE Bandung");
  await act(async () => input().click());
  await act(async () => key("Escape"));
  expect(input().getAttribute("aria-expanded")).toBe("false");
  expect(input().value).toBe("FAKE Bandung");
});
it("debounces remote searching and never submits free text as a branch ID", async () => {
  vi.useFakeTimers();
  await act(async () => input().click());
  searchChanged.mockClear();
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;
  if (!setter) throw new Error("Missing value setter");
  await act(async () => {
    setter.call(input(), "Ban");
    input().dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => {
    setter.call(input(), "Bandung");
    input().dispatchEvent(new Event("input", { bubbles: true }));
  });
  expect(searchChanged).not.toHaveBeenCalled();
  expect(
    new FormData(host.querySelector("form") as HTMLFormElement).get("branchId"),
  ).toBe("12");
  await act(async () => vi.advanceTimersByTime(300));
  expect(searchChanged).toHaveBeenCalledTimes(1);
  expect(searchChanged).toHaveBeenLastCalledWith("Bandung");
});
it("hides stale options while loading or failed", async () => {
  await act(async () => root.render(createElement(Harness, { loading: true })));
  await act(async () => input().click());
  expect(host.querySelector('[role="option"]')).toBeNull();
  expect(host.textContent).toContain("Memuat pilihan");
  await act(async () =>
    root.render(createElement(Harness, { error: "Akses ditolak" })),
  );
  expect(host.querySelector('[role="alert"]')?.textContent).toBe(
    "Akses ditolak",
  );
  expect(host.querySelector('[role="option"]')).toBeNull();
});
