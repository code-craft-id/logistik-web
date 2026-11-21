import { type ReactNode, Suspense } from "react";
import { LoadingState } from "@/components/patterns/content-state";
export const metadata = { title: "Keuangan" };
// Finance reads current authority; never prefetch/cache a session-dependent result.
export const instant = false;
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingState label="Memuat keuangan…" />}>
      {children}
    </Suspense>
  );
}
