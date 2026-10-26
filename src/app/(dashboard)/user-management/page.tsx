import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/patterns/content-state";
import { IdentityAccess } from "@/features/identity/components/identity-access";
import { UserManagementPageClient } from "./user-management-client";
export const metadata: Metadata = { title: "Manajemen User" };
export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <IdentityAccess resource="user">
        <UserManagementPageClient />
      </IdentityAccess>
    </Suspense>
  );
}
