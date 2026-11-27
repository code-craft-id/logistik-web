import { Suspense } from "react";
import { LoadingState } from "@/components/patterns/content-state";
import { InvoiceDetailPage } from "@/features/finance/components/pages";
export const instant = false;
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<LoadingState label="Memuat invoice…" />}>
      <Content params={params} />
    </Suspense>
  );
}
async function Content({ params }: { params: Promise<{ id: string }> }) {
  return <InvoiceDetailPage invoiceId={(await params).id} />;
}
