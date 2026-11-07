import { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { AwbLookup } from "@/features/bookings/components/awb-lookup";

export const metadata: Metadata = { title: "Lookup AWB" };

export default async function Page() {
  await requirePermission("view", "transaction");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Lookup AWB</h1>
        <p className="text-sm text-muted-foreground">Pencarian berdasarkan AWB No. dengan pembatasan branch scope.</p>
      </div>
      <AwbLookup />
    </div>
  );
}
