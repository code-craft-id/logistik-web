"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { pendingApprovalsAction } from "../notification-actions";

const REFRESH_MS = 60_000;
// Page changes refetch at most this often.
const NAV_MIN_MS = 15_000;

/**
 * Header bell with pending approval counts. Refreshed on page change (at
 * most every 15 s) and every minute while the tab is visible (no websocket needed).
 */
export function NotificationBell() {
  const pathname = usePathname();
  const [counts, setCounts] = useState({ awbChanges: 0, podReturns: 0 });
  const lastLoad = useRef(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: refetch on navigation
  useEffect(() => {
    const load = () => {
      if (document.visibilityState !== "visible") return;
      lastLoad.current = Date.now();
      // No cancel on navigation: the throttle would not refetch a dropped result.
      pendingApprovalsAction()
        .then(setCounts)
        .catch(() => undefined);
    };
    if (Date.now() - lastLoad.current >= NAV_MIN_MS) load();
    const timer = window.setInterval(load, REFRESH_MS);
    document.addEventListener("visibilitychange", load);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", load);
    };
  }, [pathname]);
  const total = counts.awbChanges + counts.podReturns;
  const items = [
    {
      count: counts.awbChanges,
      label: "Persetujuan Edit/delete AWB",
      href: "/transactions/approvals",
    },
    {
      count: counts.podReturns,
      label: "Approval Pod Kembali",
      href: "/pod-returns?tab=approval",
    },
  ];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative size-11"
          aria-label={
            total ? `Notifikasi: ${total} menunggu persetujuan` : "Notifikasi"
          }
        >
          <Bell aria-hidden="true" />
          {total > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-semibold text-white tabular-nums">
              {total > 99 ? "99+" : total}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {total === 0 ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">
            Tidak ada yang menunggu persetujuan Anda.
          </p>
        ) : (
          items
            .filter((item) => item.count > 0)
            .map((item) => (
              <DropdownMenuItem key={item.href} asChild>
                <Link
                  href={item.href}
                  className="flex min-h-11 items-center justify-between gap-3"
                >
                  <span>{item.label}</span>
                  <span className="rounded-full bg-destructive px-2 text-xs font-semibold text-white tabular-nums">
                    {item.count}
                  </span>
                </Link>
              </DropdownMenuItem>
            ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
