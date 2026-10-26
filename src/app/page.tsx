import { ArrowRight, Truck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Profil perusahaan",
  description:
    "Halaman profil perusahaan dan akses ke Logistics Management System.",
};

/** Public surface only. No unapproved company records or internal data are exposed. */
export default function CompanyProfilePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <a
        href="#company-profile"
        className="sr-only rounded-md bg-background p-3 text-primary focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        Lewati ke konten
      </a>
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary"
          >
            <Truck className="size-5" aria-hidden="true" />
            <span>LMS</span>
          </Link>
          <Button asChild variant="outline" className="min-h-11">
            <Link href="/login">Masuk ke LMS</Link>
          </Button>
        </div>
      </header>
      <main
        id="company-profile"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-6 px-4 py-16 focus:outline-none sm:px-6 sm:py-24"
      >
        <p className="text-sm font-medium text-primary">Company profile</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
          Profil perusahaan
        </h1>
        <p className="max-w-prose text-base leading-relaxed text-muted-foreground">
          Halaman ini disiapkan untuk profil resmi perusahaan. Informasi
          perusahaan belum dipublikasikan.
        </p>
        <Button asChild className="min-h-11 self-start">
          <Link href="/login">
            Masuk ke sistem
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </main>
      <footer className="border-t px-4 py-5 text-sm text-muted-foreground sm:px-6">
        <div className="mx-auto max-w-6xl">Logistics Management System</div>
      </footer>
    </div>
  );
}
