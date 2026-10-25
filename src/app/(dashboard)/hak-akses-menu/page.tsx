import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/patterns/content-state";
import { IdentityAccess } from "@/features/identity/components/identity-access";
import { PermissionMatrixPageClient } from "./permission-matrix-client";
export const metadata: Metadata = { title: "Hak Akses Menu" };
export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <IdentityAccess resource="permission">
        <PermissionMatrixPageClient />
      </IdentityAccess>
    </Suspense>
  );
}
