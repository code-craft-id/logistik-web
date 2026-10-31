"use client";

import { useState, useTransition } from "react";
import { lookupTransactionAction } from "../lookup-actions";

export function AwbLookup() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<any>(null);

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await lookupTransactionAction(formData);
      setResult(res);
    });
  }

  return (
    <div className="space-y-4">
      <form action={onSubmit} className="flex gap-2">
        <input name="awbNo" placeholder="Cari AWB No." className="border rounded px-2 py-1" required />
        <button type="submit" disabled={isPending} className="px-3 py-1 border rounded">
          {isPending ? "Mencari..." : "Cari"}
        </button>
      </form>
      {result && (
        <div className="border rounded p-4">
          {result.found ? (
            <div>
              <div>AWB: {result.data.awbNo}</div>
              <div>Status: {result.data.status}</div>
              <div>Tanggal: {result.data.transactionDate}</div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Tidak ditemukan</div>
          )}
        </div>
      )}
    </div>
  );
}
