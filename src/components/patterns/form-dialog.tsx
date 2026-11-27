"use client";

import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ModulResult } from "@/features/modul/actions";
import { ActionForm } from "@/features/modul/components/action-form";
import { cn } from "@/lib/utils";

/**
 * A table/page action that opens its inputs in a modal instead of inline
 * fields. The form submits a server action, shows its message and closes on
 * success; Batal closes without saving.
 */
export function FormDialog({
  trigger,
  title,
  description,
  action,
  submitLabel = "Simpan",
  triggerVariant = "default",
  destructive = false,
  wide = false,
  buttons,
  children,
}: {
  trigger: string;
  title: string;
  description?: string;
  action: (formData: FormData) => Promise<ModulResult>;
  submitLabel?: string;
  triggerVariant?: "default" | "outline" | "destructive" | "secondary";
  destructive?: boolean;
  wide?: boolean;
  /** Submit buttons replacing the single submit (e.g. Setujui / Tolak). */
  buttons?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant={triggerVariant} className="min-h-11">
          {trigger}
        </Button>
      </DialogTrigger>
      <DialogContent className={cn(wide && "sm:max-w-2xl")}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <ActionForm
          action={action}
          onDone={() => setOpen(false)}
          submit={
            <>
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={() => setOpen(false)}
              >
                Batal
              </Button>
              {buttons ?? (
                <Button
                  type="submit"
                  variant={destructive ? "destructive" : "default"}
                  className="min-h-11"
                >
                  {submitLabel}
                </Button>
              )}
            </>
          }
        >
          <div className={cn("grid gap-3", wide && "sm:grid-cols-2")}>
            {children}
          </div>
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}
