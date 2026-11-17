import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoadingState } from "@/components/patterns/content-state";
import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";
import { permits } from "@/features/identity/permissions";
import { currentIdentity } from "@/features/identity/server/context";
import { OperationalReportPage } from "@/features/reports/operational/components/report-page";

export const metadata: Metadata = { title: "Dashboard" };
export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<LoadingState label="Memuat dashboard…" />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
/**
 * /dashboard is the post-login landing for every user, so it must never deny access.
 * Users holding dashboard_report.view get the operational counts (authorized again
 * inside the report service); everyone else keeps the general overview from main.
 */
async function Content({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const identity = await currentIdentity();
  if (!identity?.actor) redirect("/login");
  if (!permits(identity.actor, "view", "dashboard_report"))
    return <DashboardOverview />;
  return <OperationalReportPage kind="dashboard" query={await searchParams} />;
}
