import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/patterns/content-state";
import { TicketCreatePage } from "@/features/ticketing/components/ticket-pages";
export const metadata: Metadata = { title: "Buat tiket" };
export default function Page() {
  return (
    <Suspense fallback={<LoadingState label="Memuat formulir tiket…" />}>
      <TicketCreatePage />
    </Suspense>
  );
}
