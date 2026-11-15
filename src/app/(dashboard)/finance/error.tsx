"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div role="alert" className="space-y-4">
      <h1 className="text-xl font-semibold">
        Data keuangan belum dapat dimuat
      </h1>
      <p>Periksa akses dan koneksi, lalu coba kembali.</p>
      <Button className="min-h-11" onClick={reset}>
        Coba kembali
      </Button>
    </div>
  );
}
