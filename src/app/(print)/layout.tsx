import type { ReactNode } from "react";

/** Print documents: no application shell, white page, A4-friendly margins. */
export default function PrintLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-white text-black">
      <style>{"@page { size: A4; margin: 10mm; }"}</style>
      {children}
    </div>
  );
}
