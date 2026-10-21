import { Truck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginPreview() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-workspace px-4 py-8">
      <section
        aria-labelledby="login-title"
        className="w-full max-w-md rounded-2xl border bg-background p-6 sm:p-8"
      >
        <div className="mb-6 text-center">
          <Truck
            className="mx-auto mb-4 size-9 text-primary"
            aria-hidden="true"
          />
          <p className="mb-2 font-semibold">LMS</p>
          <h1 id="login-title" className="text-xl font-semibold">
            Masuk Sistem
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Masukkan akun Anda untuk melanjutkan
          </p>
        </div>
        <p
          id="login-preview-help"
          className="mb-5 rounded-lg border bg-muted/50 p-3 text-sm leading-6 text-muted-foreground"
        >
          UI preview only. Authentication is unavailable until PLT-01. Do not
          enter real credentials.
        </p>
        <div aria-describedby="login-preview-help" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-username">Username</Label>
            <Input
              id="login-username"
              disabled
              placeholder="Masukkan username"
              autoComplete="off"
              className="min-h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              disabled
              placeholder="Masukkan password"
              autoComplete="off"
              className="min-h-11"
            />
          </div>
          <Button disabled className="min-h-11 w-full">
            Masuk — unavailable
          </Button>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Sistem Logistik · Presentation preview
        </p>
        <Link
          href="/"
          className="mt-3 flex min-h-11 items-center justify-center text-sm text-primary underline underline-offset-4"
        >
          Browse UI previews
        </Link>
      </section>
    </main>
  );
}
