"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { DashboardInsights } from "../contracts";

const preferenceKey = "lms.dashboard.quick-actions.v1";
const panel = "min-w-0 rounded-lg border bg-background p-4 sm:p-6";

/** Personal browser preference; the server supplies only authorized destinations. */
export function DashboardQuickActions({
  actions,
}: {
  actions: DashboardInsights["actions"];
}) {
  const authorized = useMemo(
    () => new Set(actions.map((item) => item.href)),
    [actions],
  );
  const [selected, setSelected] = useState<string[]>(() =>
    actions.map((item) => item.href),
  );
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(preferenceKey);
      if (saved !== null) {
        const parsed: unknown = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.every((value) => typeof value === "string")
        ) {
          setSelected(parsed.filter((href) => authorized.has(href)));
        }
      }
    } catch {
      // A disabled or unavailable browser store falls back to server defaults.
    }
    setLoaded(true);
  }, [authorized]);

  const visible = actions.filter((item) => selected.includes(item.href));
  function setPreference(next: string[]) {
    const allowed = next.filter((href) => authorized.has(href));
    setSelected(allowed);
    try {
      window.localStorage.setItem(preferenceKey, JSON.stringify(allowed));
    } catch {
      // The selection remains usable for the current page if storage is blocked.
    }
  }

  return (
    <section aria-labelledby="dash-actions" className={panel}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="dash-actions" className="font-semibold">
          Quick Action
        </h2>
        <details className="group">
          <summary className="inline-flex min-h-11 cursor-pointer items-center rounded-md border px-3 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Atur menu
          </summary>
          <div className="mt-3 rounded-lg border bg-background p-3 sm:min-w-80">
            <p className="text-sm text-muted-foreground">
              Pilih pintasan yang ingin ditampilkan. Tersimpan di browser ini;
              pilihan tetap mengikuti hak akses akun.
            </p>
            <div className="mt-3 space-y-2">
              {actions.map((action) => (
                <label
                  key={action.href}
                  className="flex min-h-10 items-center gap-3 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(action.href)}
                    onChange={(event) =>
                      setPreference(
                        event.currentTarget.checked
                          ? [...selected, action.href]
                          : selected.filter((href) => href !== action.href),
                      )
                    }
                    disabled={!loaded}
                    className="size-4 accent-primary"
                  />
                  {action.label}
                </label>
              ))}
            </div>
            <button
              type="button"
              className="mt-3 inline-flex min-h-10 items-center text-sm text-primary underline underline-offset-4 disabled:opacity-50"
              disabled={!loaded}
              onClick={() =>
                setPreference(actions.map((action) => action.href))
              }
            >
              Pulihkan semua pintasan
            </button>
          </div>
        </details>
      </div>
      {visible.length ? (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((action) => (
            <li key={action.href}>
              <Link
                prefetch={false}
                href={action.href}
                className="flex min-h-11 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {action.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Belum ada pintasan dipilih. Buka “Atur menu” untuk menampilkannya.
        </p>
      )}
    </section>
  );
}
