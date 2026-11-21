import Link from "next/link";
import { EmptyState } from "@/components/patterns/content-state";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <EmptyState
      title="Data tidak ditemukan"
      description="Data ini tidak ada, sudah dihapus, atau bukan milik cabang Anda."
      action={
        <Button asChild variant="outline" className="min-h-11">
          <Link href="/dashboard">Kembali ke Dashboard</Link>
        </Button>
      }
    />
  );
}
