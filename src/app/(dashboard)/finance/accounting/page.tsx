import { Suspense } from "react";
import { LoadingState } from "@/components/patterns/content-state";
import { AccountingHomePage } from "@/features/finance/components/accounting-pages";

export default function Page() {
  return (
    <Suspense fallback={<LoadingState label="Memuat akuntansi…" />}>
      <AccountingHomePage />
    </Suspense>
  );
}
