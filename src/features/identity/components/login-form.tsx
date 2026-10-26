"use client";

import { Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { DASHBOARD_PATH } from "@/lib/routes";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/sign-in/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      if (!response.ok) {
        // Do not disclose account existence or surface provider internals.
        throw new Error("Invalid credentials");
      }
      router.replace(DASHBOARD_PATH);
      router.refresh();
    } catch (error) {
      setError(
        error instanceof TypeError
          ? "Tidak dapat terhubung. Silakan coba lagi."
          : "Username atau password salah. Silakan coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Truck
              className="h-7 w-7 text-primary-foreground"
              aria-hidden="true"
            />
          </div>
          <div>
            <CardTitle className="text-2xl">Masuk ke LMS</CardTitle>
            <CardDescription>Logistics Management System</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            aria-busy={loading}
          >
            {error && (
              <p className="text-center text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
                minLength={3}
                maxLength={30}
                pattern="[a-zA-Z0-9_.]+"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>
          <Separator className="my-6" />
          <p className="text-center text-xs text-muted-foreground">
            LMS v0.1.0 &copy; 2026
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
