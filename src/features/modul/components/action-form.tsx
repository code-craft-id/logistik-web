"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ModulResult } from "../actions";

/**
 * Submits a Modul server action, shows its message, and refreshes the
 * page. Several buttons may carry `name`/`value` (for example
 * decision=APPROVE or REJECT); the clicked one is sent.
 */
export function ActionForm({
  action,
  children,
  submit,
  className,
  reset = false,
  onDone,
  id,
}: {
  action: (formData: FormData) => Promise<ModulResult>;
  children?: ReactNode;
  /** Buttons; defaults to one "Simpan" button. */
  submit?: ReactNode;
  className?: string;
  reset?: boolean;
  /** Called after a successful action (for example to close a dialog). */
  onDone?: () => void;
  /** Lets inputs outside the form (form="id") join it, e.g. table checkboxes. */
  id?: string;
}) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ModulResult | null>(null);
  return (
    <form
      id={id}
      ref={form}
      className={cn("space-y-3", className)}
      onSubmit={(event) => {
        event.preventDefault();
        const submitter = (event.nativeEvent as SubmitEvent)
          .submitter as HTMLButtonElement | null;
        const data = new FormData(event.currentTarget, submitter);
        setResult(null);
        start(async () => {
          const next = await action(data);
          setResult(next);
          if (next.ok) {
            if (reset) form.current?.reset();
            if (next.redirect) router.push(next.redirect);
            else router.refresh();
            onDone?.();
          }
        });
      }}
    >
      <fieldset disabled={pending} className="min-w-0 space-y-3">
        {children}
        <div className="flex flex-wrap gap-2">
          {submit ?? (
            <Button type="submit" className="min-h-11">
              {pending ? "Menyimpan…" : "Simpan"}
            </Button>
          )}
        </div>
      </fieldset>
      {result && (
        <p
          role={result.ok ? "status" : "alert"}
          className={cn(
            "rounded-md border p-2 text-sm",
            result.ok
              ? "border-primary text-foreground"
              : "border-destructive text-destructive",
          )}
        >
          {result.message}
        </p>
      )}
    </form>
  );
}
