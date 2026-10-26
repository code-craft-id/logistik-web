import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/patterns/content-state";
import { OrganizationPage } from "@/features/organization/components/organization-page";
export const metadata: Metadata = { title: "Kantor Cabang" };
export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <OrganizationPage section="branch" />
    </Suspense>
  );
}
