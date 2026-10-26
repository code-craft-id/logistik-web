import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MasterDataWorkspace } from "../../src/features/master-data/components/master-data-workspace";
import { VendorWorkspace } from "../../src/features/master-data/components/vendor-workspace";

const actions = vi.hoisted(() => ({
  listMasterData: vi.fn(),
  masterDataChoices: vi.fn(),
  masterDataDetail: vi.fn(),
  removeMasterData: vi.fn(),
  saveMasterData: vi.fn(),
}));
vi.mock("../../src/features/master-data/actions", () => actions);
vi.mock("../../src/features/master-data/personnel-import-actions", () => ({
  previewPersonnelImport: vi.fn(),
  commitPersonnelImport: vi.fn(),
}));
vi.mock(
  "../../src/features/organization/components/configuration-workspace",
  () => ({
    ConfigurationWorkspace: () => null,
  }),
);
const date = new Date("2026-10-25T00:00:00.000Z");
const row = {
  id: 7,
  name: "FAKE Driver",
  status: "ACTIVE",
  updatedAt: date,
  address: "FAKE Address",
  phone: "INVALID-PHONE",
  branchId: 3,
};
const page = {
  ok: true,
  data: {
    items: [row],
    pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    globalWriter: false,
  },
};
let root: Root, host: HTMLDivElement;
function button(name: string) {
  const found = [...document.querySelectorAll("button")].find(
    (button) => button.textContent?.trim() === name,
  );
  if (!found) throw new Error(`Missing button ${name}`);
  return found;
}
const render = () =>
  act(async () =>
    root.render(
      createElement(MasterDataWorkspace, {
        title: "Divisi Logistik",
        kinds: ["driver", "courier"],
        capabilities: {
          driver: { create: true, update: true, delete: true },
          courier: {},
        },
      }),
    ),
  );
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  for (const action of Object.values(actions)) action.mockReset();
  actions.listMasterData.mockResolvedValue(page);
  actions.masterDataDetail.mockResolvedValue({
    ok: true,
    data: {
      ...row,
      nationalIdNumber: "INVALID-ID",
      driverLicenseNumber: "INVALID-LICENSE",
    },
  });
  actions.masterDataChoices.mockResolvedValue({
    ok: true,
    data: { items: [{ id: 3, name: "FAKE Branch" }], page: 1, totalPages: 1 },
  });
  actions.saveMasterData.mockResolvedValue({ ok: true, data: { id: 7 } });
  actions.removeMasterData.mockResolvedValue({
    ok: true,
    data: { success: true },
  });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});
describe("Dev 1 reference workspace", () => {
  it.each([
    ["create", "rejection"],
    ["create", "network"],
    ["edit", "rejection"],
    ["edit", "network"],
  ])("preserves %s input after a %s failure and allows retry", async (mode, failure) => {
    if (failure === "network")
      actions.saveMasterData.mockRejectedValueOnce(new Error("Network failed"));
    else
      actions.saveMasterData.mockResolvedValueOnce({
        ok: false,
        message: "FAKE validation error",
      });
    await render();
    await act(async () =>
      button(mode === "edit" ? "Edit" : "Tambah Driver").click(),
    );
    const form = document.querySelector<HTMLFormElement>(
      '[role="dialog"] form',
    );
    if (!form) throw new Error("Missing editor form");
    const values = {
      name: "FAKE unsaved name",
      address: "FAKE unsaved address",
      nationalIdNumber: "FAKE unsaved ID",
    };
    for (const [key, value] of Object.entries(values)) {
      const field = form.querySelector<HTMLInputElement>(`[name="${key}"]`);
      if (!field) throw new Error(`Missing field ${key}`);
      field.value = value;
    }
    await act(async () => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });
    expect(form.querySelector('[role="alert"]')?.textContent).toContain(
      failure === "network" ? "Data gagal disimpan" : "FAKE validation error",
    );
    for (const [key, value] of Object.entries(values))
      expect(
        form.querySelector<HTMLInputElement>(`[name="${key}"]`)?.value,
      ).toBe(value);
    expect(button("Simpan").disabled).toBe(false);
    await act(async () => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });
    expect(actions.saveMasterData).toHaveBeenLastCalledWith(
      "driver",
      mode === "edit" ? row.id : null,
      expect.objectContaining(values),
      mode === "edit" ? date : undefined,
    );
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(host.textContent).toContain("Data tersimpan.");
  });
  it("loads scoped data, keeps private identifiers out of the table, and applies search on submit", async () => {
    await render();
    expect(host.textContent).toContain("FAKE Driver");
    expect(host.textContent).not.toMatch(/Nomor KTP|Nomor SIM|INVALID-ID/);
    const search = host.querySelector<HTMLInputElement>(
      'input[id="master-search-driver"]',
    );
    if (!search) throw new Error("Missing search");
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    await act(async () => {
      setter?.call(search, "FAKE");
      search.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(actions.listMasterData).toHaveBeenCalledTimes(1);
    await act(async () =>
      host
        .querySelector("form")
        ?.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        ),
    );
    expect(actions.listMasterData).toHaveBeenLastCalledWith(
      "driver",
      expect.objectContaining({ search: "FAKE", page: 1 }),
    );
  });
  it("loads authorized detail for editing and restores focus to its opener on cancellation", async () => {
    await render();
    const edit = button("Edit");
    edit.focus();
    await act(async () => edit.click());
    expect(actions.masterDataDetail).toHaveBeenCalledWith("driver", 7);
    expect(
      document.querySelector<HTMLInputElement>("#master-nationalIdNumber")
        ?.value,
    ).toBe("INVALID-ID");
    expect(
      document.querySelector<HTMLInputElement>(
        'input[type="hidden"][name="branchId"]',
      )?.value,
    ).toBe("3");
    await act(async () => button("Batal").click());
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(edit);
    expect(actions.saveMasterData).not.toHaveBeenCalled();
  });
  it("dismisses the searchable choice before its containing dialog on Escape", async () => {
    await render();
    await act(async () => button("Edit").click());
    const branch = document.querySelector<HTMLInputElement>("#master-branchId");
    if (!branch) throw new Error("Missing branch combobox");
    await act(async () => {
      branch.focus();
      branch.click();
    });
    expect(branch.getAttribute("aria-expanded")).toBe("true");
    await act(async () =>
      branch.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
          cancelable: true,
        }),
      ),
    );
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    expect(branch.getAttribute("aria-expanded")).toBe("false");
    await act(async () =>
      branch.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
          cancelable: true,
        }),
      ),
    );
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
  it("blocks submission while related choices load or fail", async () => {
    actions.masterDataChoices.mockResolvedValue({
      ok: false,
      message: "Pilihan tidak tersedia",
    });
    await render();
    await act(async () => button("Tambah Driver").click());
    expect(document.body.textContent).toContain("Pilihan tidak tersedia");
    expect(button("Simpan").disabled).toBe(true);
    expect(actions.saveMasterData).not.toHaveBeenCalled();
  });
  it("requires a separate deletion confirmation, preserves the dialog on denial, and makes no optimistic removal", async () => {
    actions.removeMasterData.mockResolvedValue({
      ok: false,
      message: "Akses ditolak",
    });
    await render();
    await act(async () => button("Hapus").click());
    expect(actions.removeMasterData).not.toHaveBeenCalled();
    const dialog = document.querySelector('[role="dialog"]');
    const confirm = [...(dialog?.querySelectorAll("button") ?? [])].find(
      (button) => button.textContent === "Hapus",
    );
    if (!confirm) throw new Error("Missing confirmation");
    await act(async () => confirm.click());
    expect(actions.removeMasterData).toHaveBeenCalledWith("driver", 7);
    expect(document.body.textContent).toContain("Akses ditolak");
    expect(host.textContent).toContain("FAKE Driver");
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  });
  it("exposes Marketing as a persisted division master and keeps its identity number private in the list", async () => {
    await act(async () =>
      root.render(
        createElement(MasterDataWorkspace, {
          title: "Divisi Logistik",
          kinds: ["marketing_person", "driver", "courier"],
          capabilities: { marketing_person: { create: true, update: true } },
        }),
      ),
    );
    expect(actions.listMasterData).toHaveBeenCalledWith(
      "marketing_person",
      expect.anything(),
    );
    expect(host.textContent).not.toContain("Nomor KTP");
    await act(async () => button("Tambah Marketing").click());
    expect(actions.masterDataChoices).toHaveBeenCalledWith(
      "marketing_person",
      "branch",
      expect.anything(),
    );
    expect(document.querySelector("#master-nationalIdNumber")).not.toBeNull();
    expect(document.querySelector("#master-driverLicenseNumber")).toBeNull();
  });
  it("shows vendor services inside the existing vendor page for service-only readers", async () => {
    await act(async () =>
      root.render(
        createElement(VendorWorkspace, {
          canViewVendor: false,
          canViewTax: false,
          canViewServices: true,
          capabilities: {},
          serviceCapabilities: { create: true },
        }),
      ),
    );
    expect(
      [...host.querySelectorAll('[role="tab"]')].map((tab) => tab.textContent),
    ).toEqual(["Layanan Vendor"]);
    expect(actions.listMasterData).toHaveBeenCalledWith(
      "vendor_service",
      expect.anything(),
    );
    await act(async () => button("Tambah Layanan Vendor").click());
    expect(actions.masterDataChoices).toHaveBeenCalledWith(
      "vendor_service",
      "vendor",
      expect.anything(),
    );
    expect(document.querySelector("#master-vendorId")).not.toBeNull();
  });
  it("numbers rows across pages independently of database IDs", async () => {
    actions.listMasterData.mockResolvedValue({
      ...page,
      data: {
        ...page.data,
        pagination: { page: 1, pageSize: 20, total: 21, totalPages: 2 },
      },
    });
    await render();
    expect(host.querySelector("tbody tr td")?.textContent).toBe("1");
    actions.listMasterData.mockResolvedValue({
      ...page,
      data: {
        ...page.data,
        pagination: { page: 2, pageSize: 20, total: 21, totalPages: 2 },
      },
    });
    await act(async () => button("Berikutnya").click());
    expect(host.querySelector("tbody tr td")?.textContent).toBe("21");
    expect(actions.listMasterData).toHaveBeenLastCalledWith(
      "driver",
      expect.objectContaining({ page: 2, pageSize: 20 }),
    );
  });
  it("renders recoverable load failures and hides mutation controls for read-only access", async () => {
    actions.listMasterData.mockResolvedValueOnce({
      ok: false,
      message: "Data gagal dimuat",
    });
    await render();
    expect(host.textContent).toContain("Data gagal dimuat");
    await act(async () => button("Coba lagi").click());
    expect(host.textContent).toContain("FAKE Driver");
    await act(async () => button("Kurir").click());
    expect(host.textContent).toContain("Hanya baca");
    expect(host.textContent).not.toContain("Tambah Kurir");
  });
});
