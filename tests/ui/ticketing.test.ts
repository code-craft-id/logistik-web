import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TicketForm } from "../../src/features/ticketing/components/ticket-form";
import {
  TicketDetail,
  TicketList,
} from "../../src/features/ticketing/components/ticket-views";

const { save, push } = vi.hoisted(() => ({ save: vi.fn(), push: vi.fn() }));
vi.mock("../../src/features/ticketing/actions", () => ({ createTicket: save }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));
let root: Root, host: HTMLDivElement;
beforeEach(() => {
  vi.resetAllMocks();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});
it("labels all create fields, has no invented lifecycle controls and requires priority", async () => {
  await act(async () =>
    root.render(
      createElement(TicketForm, {
        branches: [{ id: 10, name: "FAKE Branch" }],
        idempotencyKey: "d460cad2-5200-4a1f-8a98-9509932c93b7",
      }),
    ),
  );
  for (const name of [
    "branchId",
    "subject",
    "menuName",
    "relatedPageUrl",
    "remarks",
    "priority",
  ]) {
    const field = host.querySelector<HTMLInputElement>(`[name="${name}"]`);
    if (!field) throw new Error(`Missing ${name}`);
    expect(field).not.toBeNull();
    expect(host.querySelector(`label[for="${field.id}"]`)).not.toBeNull();
  }
  expect(
    host.querySelector<HTMLSelectElement>('[name="priority"]')?.value,
  ).toBe("");
  expect(host.textContent).not.toMatch(/Approval|Approve By|Picture/);
});
it("disables repeat submission while pending, then shows a sanitized error and permits retry", async () => {
  let finish!: (value: unknown) => void;
  save.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await act(async () =>
    root.render(
      createElement(TicketForm, {
        branches: [{ id: 10, name: "FAKE Branch" }],
        idempotencyKey: "d460cad2-5200-4a1f-8a98-9509932c93b7",
      }),
    ),
  );
  const form = host.querySelector("form");
  if (!form) throw new Error("Missing form");
  await act(async () => {
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
  });
  expect(
    host.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled,
  ).toBe(true);
  await act(async () =>
    finish({ ok: false, message: "Cabang tidak tersedia." }),
  );
  expect(host.querySelector('[role="alert"]')?.textContent).toContain(
    "Cabang tidak tersedia.",
  );
  expect(
    host.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled,
  ).toBe(false);
});
it("shows empty recovery and inert escaped URL/remarks with labelled UTC and internal ID", async () => {
  await act(async () =>
    root.render(
      createElement(TicketList, {
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
        search: "",
        canCreate: true,
      }),
    ),
  );
  expect(host.textContent).toContain("Belum ada tiket");
  const ticket = {
    id: 7,
    branchId: 10,
    createdById: 1,
    subject: "FAKE subject",
    menuName: "Menu",
    relatedPageUrl: "https://example.test/<script>",
    remarks: "<script>alert(1)</script>",
    priority: "Low",
    createdAt: "2026-11-15T00:00:00.000Z",
  };
  await act(async () => root.render(createElement(TicketDetail, { ticket })));
  expect(host.querySelector("script")).toBeNull();
  expect(host.querySelector('a[href^="https:"]')).toBeNull();
  expect(host.textContent).toContain("UTC");
  expect(host.textContent).toContain("ID internal");
  expect(host.textContent).toContain(ticket.remarks);
});
it("keeps the replay key stable through retry and navigates to the persisted detail", async () => {
  save
    .mockResolvedValueOnce({ ok: false, message: "Coba kembali." })
    .mockResolvedValueOnce({ ok: true, id: 42 });
  const key = "d460cad2-5200-4a1f-8a98-9509932c93b7";
  await act(async () =>
    root.render(
      createElement(TicketForm, {
        branches: [{ id: 10, name: "FAKE" }],
        idempotencyKey: key,
      }),
    ),
  );
  const form = host.querySelector("form");
  if (!form) throw new Error("Missing form");
  for (const [name, value] of Object.entries({
    branchId: "10",
    subject: "FAKE Subject",
    menuName: "FAKE Menu",
    relatedPageUrl: "/safe",
    priority: "High",
  })) {
    const field = form.querySelector<HTMLInputElement>(`[name="${name}"]`);
    if (!field) throw new Error(`Missing ${name}`);
    field.value = value;
  }
  for (let i = 0; i < 2; i++)
    await act(async () => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });
  expect(save.mock.calls.map((call) => call[0].idempotencyKey)).toEqual([
    key,
    key,
  ]);
  expect(save.mock.calls[1][0]).toMatchObject({
    subject: "FAKE Subject",
    priority: "High",
    branchId: "10",
  });
  expect(push).toHaveBeenCalledWith("/ticketting/42");
  expect(host.textContent).toContain("Tiket tersimpan");
});
it("disables creation when no active branch is available", async () => {
  await act(async () =>
    root.render(
      createElement(TicketForm, {
        branches: [],
        idempotencyKey: "d460cad2-5200-4a1f-8a98-9509932c93b7",
      }),
    ),
  );
  expect(
    host.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled,
  ).toBe(true);
  expect(host.textContent).toContain("Tidak ada cabang aktif");
});
