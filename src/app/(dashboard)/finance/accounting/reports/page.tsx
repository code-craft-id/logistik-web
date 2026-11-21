import { FinancialReportsPage } from "@/features/finance/components/accounting-pages";
import { FinanceQueryPage } from "@/features/finance/components/query-page";
export const instant = false;
export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <FinanceQueryPage
      searchParams={searchParams}
      Screen={FinancialReportsPage}
    />
  );
}
