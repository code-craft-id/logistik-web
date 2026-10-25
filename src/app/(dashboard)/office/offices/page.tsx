import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/patterns/content-state";
import { OrganizationPage } from "@/features/organization/components/organization-page";
export const metadata: Metadata = { title: "Kantor" };
export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <OrganizationPage section="office" />
    </Suspense>
  );
}
