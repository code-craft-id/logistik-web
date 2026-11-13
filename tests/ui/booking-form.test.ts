import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BookingForm } from "../../src/features/bookings/components/booking-form";

const { createBookingActionMock } = vi.hoisted(() => ({
  createBookingActionMock: vi.fn(),
}));

vi.mock("../../src/features/bookings/actions", () => ({
  createBookingAction: (...args: unknown[]) => createBookingActionMock(...args),
}));

let root: Root;
let host: HTMLDivElement;

beforeEach(() => {
  vi.clearAllMocks();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});

async function submit() {
  const form = host.querySelector<HTMLFormElement>("form");
  if (!form) throw new Error("form not found");
  await act(async () => {
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
  });
  // Allow async server action + React transition/state updates to settle.
  for (let i = 0; i < 10; i++) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

describe("BookingForm", () => {
  it("shows an error message when createBookingAction returns ok:false", async () => {
    createBookingActionMock.mockResolvedValue({
      ok: false,
      error: "FORBIDDEN_BRANCH",
    });

    await act(async () => root.render(createElement(BookingForm)));
    await submit();

    await vi.waitFor(() => {
      expect(createBookingActionMock).toHaveBeenCalled();
      const alert = host.querySelector('[role="alert"]');
      expect(alert?.textContent).toContain(
        "Anda tidak memiliki akses ke cabang yang dipilih.",
      );
    });
    expect(host.querySelector("output")).toBeNull();
  });

  it("shows a success message when createBookingAction returns ok:true", async () => {
    createBookingActionMock.mockResolvedValue({ ok: true, id: 123 });

    await act(async () => root.render(createElement(BookingForm)));
    await submit();

    await vi.waitFor(() => {
      expect(createBookingActionMock).toHaveBeenCalled();
      expect(host.querySelector("output")?.textContent).toContain(
        "Booking berhasil disimpan.",
      );
    });
    expect(host.querySelector('[role="alert"]')).toBeNull();
  });
});
