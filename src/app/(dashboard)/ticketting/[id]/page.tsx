import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/patterns/content-state";
import { TicketDetailPage } from "@/features/ticketing/components/ticket-pages";
export const metadata: Metadata = { title: "Detail tiket" };
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<LoadingState label="Memuat detail tiket…" />}>
      <Content params={params} />
    </Suspense>
  );
}
async function Content({ params }: { params: Promise<{ id: string }> }) {
  return <TicketDetailPage id={(await params).id} />;
}
