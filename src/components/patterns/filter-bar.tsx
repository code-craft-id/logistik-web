import type { ReactNode } from "react";

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <fieldset
      aria-label="Table filters"
      className="flex min-w-0 flex-wrap items-end gap-3 border-b bg-muted/40 p-4"
    >
      {children}
    </fieldset>
  );
}
