import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/features/identity/components/login-form";
import { currentIdentity } from "@/features/identity/server/context";
import { DASHBOARD_PATH } from "@/lib/routes";

// A valid session (checked on the server, not just the cookie) skips the form.
async function LoginGate() {
  if (await currentIdentity()) redirect(DASHBOARD_PATH);
  return <LoginForm />;
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center">
          Memuat...
        </div>
      }
    >
      <LoginGate />
    </Suspense>
  );
}
