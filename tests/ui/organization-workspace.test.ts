import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VendorWorkspace } from "../../src/features/master-data/components/vendor-workspace";
import { CompanySettingEditor } from "../../src/features/organization/components/company-setting-editor";
import { OrganizationWorkspace } from "../../src/features/organization/components/organization-workspace";
import { WhatsAppMessagePreview } from "../../src/features/organization/components/whatsapp-message-preview";

const actions = vi.hoisted(() => ({
  listOrganizations: vi.fn(),
  removeOrganization: vi.fn(),
  saveOrganization: vi.fn(),
}));
const settings = vi.hoisted(() => ({
  configurationCapabilities: vi.fn(),
  configurationChoices: vi.fn(),
  configurationDetail: vi.fn(),
  listConfigurations: vi.fn(),
  removeConfiguration: vi.fn(),
  saveConfiguration: vi.fn(),
}));
const masterActions = vi.hoisted(() => ({
  listMasterData: vi.fn(),
  masterDataDetail: vi.fn(),
  masterDataChoices: vi.fn(),
  saveMasterData: vi.fn(),
  removeMasterData: vi.fn(),
}));
vi.mock("../../src/features/master-data/actions", () => masterActions);
vi.mock("../../src/features/organization/actions", () => actions);
vi.mock("../../src/features/organization/settings-actions", () => settings);
let root: Root, host: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  Object.values(actions).forEach((action) => {
    action.mockReset();
  });
  Object.values(settings).forEach((action) => {
    action.mockReset();
  });
  const page = {
    ok: true,
    data: {
      items: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
      writable: false,
    },
  };
  actions.listOrganizations.mockResolvedValue(page);
  masterActions.listMasterData.mockResolvedValue(page);
  settings.listConfigurations.mockResolvedValue(page);
  settings.configurationCapabilities.mockResolvedValue({
    ok: true,
    data: { create: true, update: true, delete: true },
  });
  settings.configurationChoices.mockResolvedValue({
    ok: true,
    data: { items: [{ id: 12, name: "FAKE Company" }], page: 1, totalPages: 1 },
  });
  settings.saveConfiguration.mockResolvedValue({ ok: true, data: { id: 1 } });
  settings.configurationDetail.mockResolvedValue({
    ok: true,
    data: {
      id: 1,
      name: "FAKE Company",
      companyId: 12,
      description: "FAKE bank description",
      updatedAt: new Date("2026-10-25T00:00:00Z"),
    },
  });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  window.history.replaceState(null, "", "/");
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});
function button(text: string) {
  const b = [...document.querySelectorAll("button")].find(
    (b) => b.textContent?.trim() === text,
  );
  if (!b) throw new Error(text);
  return b;
}
describe("Office access and reference workflow", () => {
  it("submits all approved branch fields and preserves two address lines", async () => {
    actions.listOrganizations.mockImplementation(async (kind) => ({
      ok: true,
      data: {
        items: kind === "office" ? [{ id: 8, name: "FAKE Office" }] : [],
        pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
        writable: true,
      },
    }));
    actions.saveOrganization.mockResolvedValue({ ok: true, data: { id: 99 } });
    await act(async () =>
      root.render(
        createElement(OrganizationWorkspace, { resources: ["branch"] }),
      ),
    );
    await act(async () => button("Tambah Kantor Cabang").click());
    const form = document.querySelector(
      'section[aria-label="Form Kantor Cabang"] form',
    ) as HTMLFormElement;
    const values = {
      code: "FAKE",
      name: "FAKE Branch",
      postalCode: "00123",
      faxNumber: "000456",
      email: "branch@example.invalid",
      financeContactName: "FAKE Finance",
      marketingContactName: "FAKE Marketing",
      taxId: "FAKE-NPWP",
    };
    for (const [key, value] of Object.entries(values))
      (form.querySelector(`[name="${key}"]`) as HTMLInputElement).value = value;
    (
      form.querySelector('textarea[name="address"]') as HTMLTextAreaElement
    ).value = "FAKE Address 1\nFAKE Address 2";
    await act(async () =>
      (form.querySelector("#org-officeId") as HTMLInputElement).click(),
    );
    await act(async () =>
      (document.querySelector('[role="option"]') as HTMLElement).click(),
    );
    await act(async () =>
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      ),
    );
    expect(actions.saveOrganization).toHaveBeenCalledWith(
      "branch",
      null,
      expect.objectContaining({
        ...values,
        officeId: "8",
        address: "FAKE Address 1\nFAKE Address 2",
      }),
      undefined,
    );
  });
  it("shows only allowed tabs and ignores inaccessible hash destinations", async () => {
    window.history.replaceState(null, "", "/#perusahaan");
    await act(async () =>
      root.render(
        createElement(OrganizationWorkspace, { resources: ["branch"] }),
      ),
    );
    expect(
      [...host.querySelectorAll('[role="tab"]')].map((e) => e.textContent),
    ).toEqual(["Kantor Cabang"]);
    expect(actions.listOrganizations).toHaveBeenCalledWith(
      "branch",
      expect.anything(),
    );
    expect(
      actions.listOrganizations.mock.calls.some(([kind]) => kind === "company"),
    ).toBe(false);
  });
  it("submits an optional blank agent category as text instead of null", async () => {
    actions.listOrganizations.mockImplementation(async (kind) => ({
      ok: true,
      data: {
        items: kind === "branch" ? [{ id: 9, name: "FAKE Branch" }] : [],
        pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
        writable: true,
      },
    }));
    actions.saveOrganization.mockResolvedValue({ ok: true, data: { id: 99 } });
    await act(async () =>
      root.render(
        createElement(OrganizationWorkspace, { resources: ["agent"] }),
      ),
    );
    await act(async () => button("Tambah Agen").click());
    const form = document.querySelector(
      'section[aria-label="Form Agen"] form',
    ) as HTMLFormElement;
    for (const key of ["code", "initials", "name"])
      (form.querySelector(`input[name="${key}"]`) as HTMLInputElement).value =
        "FAKE";
    await act(async () =>
      (form.querySelector("#org-branchId") as HTMLInputElement).click(),
    );
    const option = document.querySelector('[role="option"]') as HTMLElement;
    await act(async () => option.click());
    await act(async () =>
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      ),
    );
    expect(actions.saveOrganization).toHaveBeenCalledWith(
      "agent",
      null,
      expect.objectContaining({ category: "", branchId: "9" }),
      undefined,
    );
  });
  it("removes unavailable vendor tabs and selects the first permitted tab for stale hashes", async () => {
    window.history.replaceState(null, "", "/#accounting");
    await act(async () =>
      root.render(
        createElement(VendorWorkspace, {
          canViewVendor: false,
          canViewTax: true,
          capabilities: {},
        }),
      ),
    );
    expect(
      [...host.querySelectorAll('[role="tab"]')].map((e) => e.textContent),
    ).toEqual(["NPWP"]);
    expect(
      host.querySelector('[role="tab"][aria-selected="true"]')?.textContent,
    ).toBe("NPWP");
    expect(masterActions.listMasterData).not.toHaveBeenCalled();
    expect(host.textContent).not.toContain("Accounting");
    await act(async () =>
      root.render(
        createElement(VendorWorkspace, {
          canViewVendor: true,
          canViewTax: false,
          capabilities: {},
        }),
      ),
    );
    expect(
      [...host.querySelectorAll('[role="tab"]')].map((e) => e.textContent),
    ).toEqual(["Data Vendor"]);
  });
  it("renders the company profile as an inline form and preserves its version on update", async () => {
    const row = {
      id: 12,
      name: "FAKE Company",
      updatedAt: new Date("2026-10-25T00:00:00Z"),
      isDepositAgent: false,
      showPriceOnPrint: false,
    };
    actions.listOrganizations.mockResolvedValue({
      ok: true,
      data: {
        items: [row],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
        writable: true,
      },
    });
    actions.saveOrganization.mockResolvedValue({ ok: true, data: { id: 12 } });
    await act(async () =>
      root.render(
        createElement(OrganizationWorkspace, {
          resources: ["company"],
          section: "company",
        }),
      ),
    );
    expect(host.querySelector('[aria-label="Kantor sections"]')).toBeNull();
    const form = host.querySelector(
      'section[aria-label="Form Perusahaan"] form',
    ) as HTMLFormElement;
    expect(form).not.toBeNull();
    expect(
      (form.querySelector('[name="name"]') as HTMLInputElement).value,
    ).toBe("FAKE Company");
    await act(async () =>
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      ),
    );
    expect(actions.saveOrganization).toHaveBeenCalledWith(
      "company",
      12,
      expect.objectContaining({ name: "FAKE Company" }),
      row.updatedAt,
    );
    expect(actions.listOrganizations).toHaveBeenCalledWith("company", {
      id: 12,
    });
  });
  it("keeps inline configuration edits available after a failed save", async () => {
    settings.saveConfiguration.mockResolvedValue({
      ok: false,
      message: "FAKE validation error",
    });
    await act(async () =>
      root.render(
        createElement(CompanySettingEditor, {
          kind: "company_bank",
          companyId: 12,
          capabilities: { create: true },
        }),
      ),
    );
    const field = host.querySelector(
      'textarea[name="description"]',
    ) as HTMLTextAreaElement;
    field.value = "FAKE unsaved description";
    await act(async () =>
      host
        .querySelector("form")
        ?.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        ),
    );
    expect(host.querySelector('[role="alert"]')?.textContent).toBe(
      "FAKE validation error",
    );
    expect(field.value).toBe("FAKE unsaved description");
    expect(field.disabled).toBe(false);
  });
  it("shows the three WhatsApp preview tabs without saving or sending", async () => {
    await act(async () => root.render(createElement(WhatsAppMessagePreview)));
    await act(async () => button("Lihat Pesan WhatsApp").click());
    expect(
      [...document.querySelectorAll('[role="dialog"] [role="tab"]')].map(
        (e) => e.textContent,
      ),
    ).toEqual([
      "Message WA Transaksi",
      "Message WA Shipment Status",
      "Message WA Delivery Sheet",
    ]);
    expect(
      (
        document.querySelector(
          '[role="dialog"] textarea',
        ) as HTMLTextAreaElement
      ).readOnly,
    ).toBe(true);
    expect(settings.saveConfiguration).not.toHaveBeenCalled();
  });
  it("filters company configuration and pins the company on new records", async () => {
    await act(async () =>
      root.render(
        createElement(OrganizationWorkspace, { resources: ["company_bank"] }),
      ),
    );
    expect(
      [...host.querySelectorAll('[role="tab"]')].map((e) => e.textContent),
    ).toEqual(["Perusahaan", "Data Bank"]);
    expect(settings.listConfigurations).not.toHaveBeenCalled();
    await act(async () =>
      (
        host.querySelector("#company-filter-company_bank") as HTMLInputElement
      ).click(),
    );
    await act(async () =>
      (host.querySelector('[role="option"]') as HTMLElement).click(),
    );
    expect(settings.listConfigurations).toHaveBeenCalledWith(
      "company_bank",
      expect.objectContaining({ companyId: 12 }),
    );
    expect(
      document.querySelector('[role="dialog"] select[name="companyId"]'),
    ).toBeNull();
    const input = document.querySelector(
      'textarea[name="description"]',
    ) as HTMLInputElement;
    input.value = "FAKE bank description";
    await act(async () =>
      document
        .querySelector('section[aria-label="Data Bank"] form')
        ?.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        ),
    );
    expect(settings.saveConfiguration).toHaveBeenCalledWith(
      "company_bank",
      null,
      expect.objectContaining({
        companyId: 12,
        description: "FAKE bank description",
      }),
      undefined,
    );
  });
});
