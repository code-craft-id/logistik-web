import { InvoiceListPage } from "@/features/finance/components/pages";
import { FinanceQueryPage } from "@/features/finance/components/query-page";
export const instant = false;
export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <FinanceQueryPage searchParams={searchParams} Screen={InvoiceListPage} />
  );
}
