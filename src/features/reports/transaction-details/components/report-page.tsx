import "server-only";
import { redirect } from "next/navigation";
import { ErrorState } from "@/components/patterns/content-state";
import { IdentityError } from "@/features/identity/server/access";
import { transactionReportService } from "../server/context";
import { TransactionReportView } from "./report-view";

export async function TransactionReportPage({
  query,
}: {
  query: Record<string, string | string[] | undefined>;
}) {
  try {
    const result = await transactionReportService.read(query);
    return <TransactionReportView result={result} query={query} />;
  } catch (error) {
    if (error instanceof IdentityError) {
      if (error.status === 401) redirect("/login");
      if (error.status === 403)
        return (
          <ErrorState
            title="Akses ditolak"
            description="Anda tidak memiliki akses laporan atau cabang yang dipilih. Hubungi administrator atau pilih cabang yang diizinkan."
          />
        );
    }
    throw error;
  }
}
