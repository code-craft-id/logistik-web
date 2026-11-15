import Link from "next/link";
import { EmptyState } from "@/components/patterns/content-state";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <EmptyState
      title="Tiket tidak ditemukan"
      description="Tiket tidak tersedia dalam cakupan akses Anda."
      action={
        <Button asChild variant="outline" className="min-h-11">
          <Link href="/ticketting">Kembali ke daftar</Link>
        </Button>
      }
    />
  );
}
