"use client";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function ReportSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="min-h-11"
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? "Memuat laporan…" : "Cari transaksi"}
    </Button>
  );
}
