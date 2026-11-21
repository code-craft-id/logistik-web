"use client";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
export function OperationalSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="min-h-11"
    >
      {pending ? "Memuat laporan…" : "Tampilkan laporan"}
    </Button>
  );
}
