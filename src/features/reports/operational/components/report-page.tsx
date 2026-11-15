import "server-only";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorState } from "@/components/patterns/content-state";
import { IdentityError } from "@/features/identity/server/access";
import type { OperationalKind } from "../filters";
import { operationalReportService } from "../server/context";
import { OperationalReportView } from "./report-view";
export async function OperationalReportPage({
  kind,
  query,
}: {
  kind: OperationalKind;
  query: Record<string, string | string[] | undefined>;
}) {
  try {
    return (
      <OperationalReportView
        result={await operationalReportService.read(kind, query)}
      />
    );
  } catch (error) {
    if (error instanceof IdentityError) {
      if (error.status === 401) redirect("/login");
      if (error.status === 403)
        return (
          <ErrorState
            title="Akses ditolak"
            description="Anda tidak memiliki akses laporan atau cabang yang dipilih. Pilih menu yang diizinkan atau hubungi administrator."
            action={
              <Link
                href="/profile"
                className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
              >
                Buka profil
              </Link>
            }
          />
        );
    }
    throw error;
  }
}
