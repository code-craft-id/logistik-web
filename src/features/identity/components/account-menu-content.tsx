"use client";

import { LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export type AccountSummary = {
  name: string;
  username: string | null;
  groupName: string;
  fullAccess: boolean;
};

export function AccountMenuContent({ account }: { account: AccountSummary }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);

  async function signOut() {
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Sign out failed");
      // Start a fresh document so prefetched authenticated UI cannot survive logout.
      window.location.replace("/login");
    } catch {
      setError("Belum berhasil keluar. Silakan coba lagi.");
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <>
      <div className="max-w-64 space-y-1 border-b px-3 py-3 break-words">
        <p className="text-sm font-semibold">{account.name}</p>
        {account.username && (
          <p className="text-xs text-muted-foreground">@{account.username}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Grup: {account.groupName}
        </p>
        {account.fullAccess && (
          <p className="text-xs text-muted-foreground">
            Akses penuh semua cabang
          </p>
        )}
      </div>
      <DropdownMenuItem asChild disabled={pending}>
        <Link
          href="/profile"
          aria-disabled={pending || undefined}
          tabIndex={pending ? -1 : undefined}
          onClick={(event) => {
            if (submitting.current) event.preventDefault();
          }}
        >
          <UserRound aria-hidden="true" className="size-4" />
          Profil Saya
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem
        disabled={pending}
        onSelect={(event) => {
          // Keep the menu open for progress and retry feedback until navigation.
          event.preventDefault();
          void signOut();
        }}
      >
        <LogOut aria-hidden="true" className="size-4" />
        {pending ? "Sedang keluar..." : "Keluar"}
      </DropdownMenuItem>
      {pending && <output className="sr-only">Sedang keluar...</output>}
      {error && (
        <p className="max-w-64 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
