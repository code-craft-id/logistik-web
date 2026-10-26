import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/patterns/content-state";
import { IdentityAccess } from "@/features/identity/components/identity-access";
import { UserGroupPageClient } from "./user-group-client";
export const metadata: Metadata = { title: "Grup User" };
export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <IdentityAccess resource="user_group">
        <UserGroupPageClient />
      </IdentityAccess>
    </Suspense>
  );
}
