import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ConfirmSubmit } from "../../src/components/patterns/confirm-dialog";

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

const click = async (button: HTMLButtonElement | undefined) => {
  if (!button) throw new Error("button not found");
  await act(async () => button.click());
};
const byText = (text: string) =>
  [...document.body.querySelectorAll("button")].find(
    (b) => b.textContent === text,
  );

async function renderForm(onSubmit: (data: FormData) => void, kind = "DELETE") {
  await act(async () =>
    root.render(
      createElement(
        "form",
        {
          onSubmit: (event: SubmitEvent & { preventDefault(): void }) => {
            event.preventDefault();
            const e = event as unknown as {
              currentTarget: HTMLFormElement;
              nativeEvent: SubmitEvent;
            };
            onSubmit(new FormData(e.currentTarget, e.nativeEvent.submitter));
          },
        },
        createElement("input", { name: "kind", defaultValue: kind }),
        createElement(
          ConfirmSubmit,
          {
            name: "decision",
            value: "APPROVE",
            title: "Hapus data ini?",
            onlyWhen: { field: "kind", equals: "DELETE" },
          },
          "Hapus",
        ),
      ),
    ),
  );
}

it("asks in a modal before submitting; Batal sends nothing", async () => {
  const sent = vi.fn();
  await renderForm(sent);
  await click(byText("Hapus"));
  expect(document.body.textContent).toContain("Hapus data ini?");
  await click(byText("Batal"));
  expect(sent).not.toHaveBeenCalled();
  await click(byText("Hapus"));
  await click(byText("Ya, hapus"));
  expect(sent).toHaveBeenCalledOnce();
  expect(sent.mock.calls[0][0].get("decision")).toBe("APPROVE");
});

it("submits directly when the onlyWhen condition does not match", async () => {
  const sent = vi.fn();
  await renderForm(sent, "EDIT");
  await click(byText("Hapus"));
  expect(document.body.textContent).not.toContain("Hapus data ini?");
  expect(sent).toHaveBeenCalledOnce();
});
