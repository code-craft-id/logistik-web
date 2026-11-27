"use client";

import { CircleHelp } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Small "?" icon that reveals a longer explanation on hover, keyboard focus
 * or tap. Keeps headings to one line while the full text stays available
 * to screen readers through aria-describedby.
 */
export function InfoTip({
  text,
  label = "Penjelasan",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <span className={cn("relative inline-flex align-middle", className)}>
      <button
        type="button"
        aria-label={label}
        aria-describedby={id}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        className="peer inline-flex size-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CircleHelp className="size-4" aria-hidden="true" />
      </button>
      <span
        id={id}
        role="tooltip"
        className={cn(
          "absolute top-full left-0 z-50 mt-1 hidden w-72 max-w-[calc(100vw-2rem)] rounded-md border bg-popover p-3 text-left text-sm font-normal text-popover-foreground shadow-md peer-hover:block peer-focus-visible:block",
          open && "block",
        )}
      >
        {text}
      </span>
    </span>
  );
}
