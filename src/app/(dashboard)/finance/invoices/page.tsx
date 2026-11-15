import { InvoiceListPage } from "@/features/finance/components/pages";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <InvoiceListPage query={await searchParams} />;
}
