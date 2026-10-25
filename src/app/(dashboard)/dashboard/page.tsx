import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";
import { getServerSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Dashboard" };

async function AuthenticatedDashboard() {
  const session = await getServerSession();
  if (!session?.user) redirect("/login");
  return <DashboardOverview />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<output>Memuat dashboard...</output>}>
      <AuthenticatedDashboard />
    </Suspense>
  );
}
