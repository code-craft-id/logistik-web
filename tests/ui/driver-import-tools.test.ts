import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PersonnelImportTools } from "../../src/features/master-data/components/personnel-import-tools";

const actions = vi.hoisted(() => ({
  previewPersonnelImport: vi.fn(),
  commitPersonnelImport: vi.fn(),
}));
vi.mock(
  "../../src/features/master-data/personnel-import-actions",
  () => actions,
);
let root: Root, host: HTMLDivElement;
const imported = vi.fn();
function button(name: string) {
  const element = [...document.querySelectorAll("button")].find(
    (button) => button.textContent?.trim() === name,
  );
  if (!element) throw new Error(`Missing ${name}`);
  return element;
}
async function upload(name = "FAKE.xls") {
  const field = document.querySelector<HTMLInputElement>(
    "#personnel-import-file",
  );
  if (!field) throw new Error("Missing upload");
  Object.defineProperty(field, "files", {
    configurable: true,
    value: [new File(["FAKE"], name)],
  });
  await act(async () =>
    field.dispatchEvent(new Event("change", { bubbles: true })),
  );
}
beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  imported.mockReset();
  actions.previewPersonnelImport.mockReset();
  actions.commitPersonnelImport.mockReset();
  actions.previewPersonnelImport.mockResolvedValue({
    ok: true,
    data: {
      count: 1,
      valid: true,
      issues: [],
      rows: [
        {
          row: 4,
          name: "FAKE Driver",
          branch: "FAKE Branch",
          status: "ACTIVE",
        },
      ],
    },
  });
  actions.commitPersonnelImport.mockResolvedValue({
    ok: true,
    data: { count: 1 },
  });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () =>
    root.render(
      createElement(PersonnelImportTools, {
        kind: "driver",
        onImported: imported,
      }),
    ),
  );
  await act(async () => button("Import Driver").click());
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});
it("offers a template download and requires validation before saving, then refreshes the driver list", async () => {
  expect(host.querySelector("a[download]")?.getAttribute("href")).toBe(
    "/logistics/division/template/driver",
  );
  expect(button("Simpan 0 Driver").disabled).toBe(true);
  await upload();
  expect(actions.commitPersonnelImport).not.toHaveBeenCalled();
  await act(async () =>
    document
      .querySelector('input[type="file"]')
      ?.closest("form")
      ?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  expect(actions.previewPersonnelImport).toHaveBeenCalledTimes(1);
  expect(document.body.textContent).toContain("FAKE Driver");
  expect(button("Simpan 1 Driver").disabled).toBe(false);
  await act(async () => button("Simpan 1 Driver").click());
  expect(actions.commitPersonnelImport).toHaveBeenCalledTimes(1);
  expect(imported).toHaveBeenCalledTimes(1);
  expect(host.textContent).toContain("1 driver berhasil diimpor");
});
it("invalidates a previous preview on file changes and blocks unsupported files", async () => {
  await upload();
  await act(async () =>
    document
      .querySelector('input[type="file"]')
      ?.closest("form")
      ?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  await upload("unsupported.xlsx");
  expect(button("Simpan 0 Driver").disabled).toBe(true);
  expect(document.body.textContent).toContain("Pilih file .xls");
  expect(actions.commitPersonnelImport).not.toHaveBeenCalled();
});
it("keeps failed validation visible and never imports a rejected batch", async () => {
  actions.previewPersonnelImport.mockResolvedValue({
    ok: true,
    data: {
      count: 1,
      valid: false,
      rows: [],
      issues: [{ row: 4, message: "Cabang di luar akses Anda." }],
    },
  });
  await upload();
  await act(async () =>
    document
      .querySelector('input[type="file"]')
      ?.closest("form")
      ?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  expect(document.body.textContent).toContain(
    "Baris 4: Cabang di luar akses Anda.",
  );
  expect(button("Simpan 1 Driver").disabled).toBe(true);
  expect(actions.commitPersonnelImport).not.toHaveBeenCalled();
});

it.each([
  ["courier", "Kurir"],
  ["marketing_person", "Marketing"],
] as const)("uses %s template and import permission resource", async (kind, label) => {
  await act(async () =>
    root.render(
      createElement(PersonnelImportTools, {
        key: kind,
        kind,
        onImported: imported,
      }),
    ),
  );
  expect(host.querySelector("a[download]")?.getAttribute("href")).toBe(
    `/logistics/division/template/${kind}`,
  );
  await act(async () => button(`Import ${label}`).click());
  await upload();
  await act(async () =>
    document
      .querySelector('input[type="file"]')
      ?.closest("form")
      ?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  expect(actions.previewPersonnelImport).toHaveBeenCalledWith(
    kind,
    expect.any(FormData),
  );
  await act(async () => button(`Simpan 1 ${label}`).click());
  expect(actions.commitPersonnelImport).toHaveBeenCalledWith(
    kind,
    expect.any(FormData),
  );
});
