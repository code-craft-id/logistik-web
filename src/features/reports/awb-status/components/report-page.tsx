import "server-only";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ErrorState } from "@/components/patterns/content-state";
import { IdentityError } from "@/features/identity/server/access";
import type { AwbStatusKind } from "../contracts";
import { awbView, defaultPeriod } from "../filters";
import { awbStatusReportService } from "../server/context";
import { AwbStatusReportView } from "./report-view";

type Query = Record<string, string | string[] | undefined>;

export async function AwbStatusReportPage({
  report,
  query,
}: {
  report: "awb" | "all-status";
  query: Query;
}) {
  const { view, ...rest } = query;
  const kind: AwbStatusKind | null =
    report === "all-status" ? "all-status" : awbView(view);
  if (!kind || (report === "all-status" && view !== undefined)) {
    const home =
      report === "all-status"
        ? "/customer-reports/all-status"
        : "/branch-reports/awb";
    return (
      <ErrorState
        title="Tampilan tidak dikenal"
        description={
          report === "all-status"
            ? "Laporan Semua Status tidak memiliki pilihan tampilan."
            : "Pilih AWB Tertunda atau AWB Termanifest."
        }
        action={
          <Link
            href={home}
            className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
          >
            {report === "all-status"
              ? "Buka Semua Status"
              : "Buka AWB Tertunda"}
          </Link>
        }
      />
    );
  }
  // Legacy opens with data: current month (LP-R11), today (LP-R21), all dates (LP-R10).
  await connection();
  const fallback =
    rest.startDate === undefined && rest.endDate === undefined
      ? defaultPeriod(kind)
      : null;
  const input = fallback ? { ...rest, ...fallback } : rest;
  try {
    return (
      <AwbStatusReportView
        result={await awbStatusReportService.read(kind, input)}
        query={input}
      />
    );
  } catch (error) {
    if (error instanceof IdentityError) {
      if (error.status === 401) redirect("/login");
      if (error.status === 403)
        return (
          <ErrorState
            title="Akses ditolak"
            description="Anda tidak memiliki akses laporan transaksi atau cabang yang dipilih. Pilih menu yang diizinkan atau hubungi administrator."
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
