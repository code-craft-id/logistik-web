import { type ReactNode, Suspense } from "react";
import { accessibleNavigation } from "@/components/shell/accessible-navigation";
import { AppShell } from "@/components/shell/app-shell";
import { WorkspaceAccount } from "@/features/identity/components/workspace-account";
import { currentIdentity } from "@/features/identity/server/context";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <AppShell groups={[]}>
          <output>Memuat menu…</output>
        </AppShell>
      }
    >
      <AuthorizedShell>{children}</AuthorizedShell>
    </Suspense>
  );
}
async function AuthorizedShell({ children }: { children: ReactNode }) {
  const current = await currentIdentity();
  return (
    <AppShell
      groups={accessibleNavigation(current?.actor ?? null)}
      accountContent={
        <Suspense
          fallback={
            <output className="px-3 py-2 text-sm text-muted-foreground">
              Memuat akun...
            </output>
          }
        >
          <WorkspaceAccount />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  );
}
