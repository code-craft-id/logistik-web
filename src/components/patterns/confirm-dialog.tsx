"use client";

import {
  type ComponentProps,
  type ReactNode,
  useCallback,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ConfirmOptions = {
  title: string;
  description?: ReactNode;
  /** Text of the confirming button; defaults to "Ya, hapus". */
  confirmLabel?: string;
  /** Red confirming button (default true: deletions, voids, cancellations). */
  destructive?: boolean;
};

/**
 * Promise-based confirmation modal: `if (!(await confirm({...}))) return;`.
 * Render `dialog` once in the component. Replaces window.confirm so every
 * delete asks first in the app's own accessible dialog (Escape/Batal cancel,
 * focus returns to the trigger).
 */
export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);
  const trigger = useRef<HTMLElement | null>(null);

  const finish = useCallback((ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setOptions(null);
  }, []);

  const confirm = useCallback((next: ConfirmOptions) => {
    resolver.current?.(false);
    trigger.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const dialog = (
    <Dialog
      open={!!options}
      onOpenChange={(open) => {
        if (!open) finish(false);
      }}
    >
      <DialogContent
        onCloseAutoFocus={(event) => {
          if (trigger.current?.isConnected) {
            event.preventDefault();
            trigger.current.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{options?.title}</DialogTitle>
          {options?.description && (
            <DialogDescription>{options.description}</DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => finish(false)}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant={options?.destructive === false ? "default" : "destructive"}
            className="min-h-11"
            onClick={() => finish(true)}
          >
            {options?.confirmLabel ?? "Ya, hapus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return { confirm, dialog };
}

/**
 * A submit button that asks in a modal first, for server-action forms
 * (usable from Server Components). Form validation runs before the modal;
 * after "Ya", the form is submitted with this button's name/value.
 * `onlyWhen` limits the question to some field values, e.g. kind=DELETE.
 */
export function ConfirmSubmit({
  children,
  title,
  description,
  confirmLabel,
  destructive,
  name,
  value,
  onlyWhen,
  ...button
}: Omit<ComponentProps<typeof Button>, "type" | "onClick" | "title"> &
  ConfirmOptions & {
    name?: string;
    value?: string;
    onlyWhen?: { field: string; equals: string };
  }) {
  const { confirm, dialog } = useConfirm();
  const submitter = useRef<HTMLButtonElement>(null);
  return (
    <>
      <Button
        {...button}
        type="button"
        onClick={async (event) => {
          const form = event.currentTarget.form;
          if (!form || !form.reportValidity()) return;
          const field = onlyWhen
            ? form.elements.namedItem(onlyWhen.field)
            : null;
          const ask =
            !onlyWhen ||
            ((field instanceof HTMLSelectElement ||
              field instanceof HTMLInputElement) &&
              field.value === onlyWhen.equals);
          if (
            ask &&
            !(await confirm({ title, description, confirmLabel, destructive }))
          )
            return;
          form.requestSubmit(submitter.current);
        }}
      >
        {children}
      </Button>
      <button
        ref={submitter}
        type="submit"
        name={name}
        value={value}
        hidden
        tabIndex={-1}
        aria-hidden="true"
      />
      {dialog}
    </>
  );
}
