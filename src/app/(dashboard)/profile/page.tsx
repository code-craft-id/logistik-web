import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { currentIdentity } from "@/features/identity/server/context";
import { ProfilePageClient } from "./profile-client";

export const metadata: Metadata = { title: "Profil Saya" };

async function AuthenticatedProfile() {
  if (!(await currentIdentity())) redirect("/login");
  return <ProfilePageClient />;
}

export default function Page() {
  return (
    <Suspense fallback={<output>Memuat profil...</output>}>
      <AuthenticatedProfile />
    </Suspense>
  );
}
