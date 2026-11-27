import { Suspense } from "react";
import { LoadingState } from "@/components/patterns/content-state";
import { InvoiceNewPage } from "@/features/finance/components/pages";
export const instant = false;
export default function Page() {
  return (
    <Suspense fallback={<LoadingState label="Memuat invoice…" />}>
      <InvoiceNewPage />
    </Suspense>
  );
}
