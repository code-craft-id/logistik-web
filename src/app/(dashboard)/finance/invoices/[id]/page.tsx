import { InvoiceDetailPage } from "@/features/finance/components/pages";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <InvoiceDetailPage invoiceId={(await params).id} />;
}
