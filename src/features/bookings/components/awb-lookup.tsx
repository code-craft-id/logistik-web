"use client";

import { useEffect, useState, useTransition } from "react";
import { lookupTransactionAction } from "../lookup-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type BranchOption = { id: number; code: string; name: string };

type LookupData = {
  id: number;
  awbNo: string;
  status: string;
  transactionDate: string;
  originBranchId: number | null;
  destinationBranchId: number | null;
  originBranch?: BranchOption;
  destinationBranch?: BranchOption | null;
};

type LookupResult =
  | { found: false; error?: string; code?: string; needsOriginBranch?: boolean }
  | { found: true; data: LookupData }
  | { found: true; multiple: true; data: LookupData[] };

export function AwbLookup() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<LookupResult | null>(null);
  const [awbValue, setAwbValue] = useState("");
  const [originBranchId, setOriginBranchId] = useState<string>("");
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [resultOriginBranches, setResultOriginBranches] = useState<BranchOption[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [branchesLoaded, setBranchesLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadBranches() {
      try {
        const res = await fetch("/api/identity/branches/me", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (cancelled) return;
          if (Array.isArray(data.branches)) {
            setBranches(data.branches);
            setIsAdmin(Boolean(data.isAdmin));
            if (!cancelled) setBranchesLoaded(true);
            return;
          }
        }
        const fallback = await fetch("/api/user-management/branches", { cache: "no-store" });
        if (!fallback.ok) {
          if (!cancelled) setBranchesLoaded(true);
          return;
        }
        const data = await fallback.json();
        if (cancelled) return;
        if (Array.isArray(data.branches)) {
          setBranches(data.branches);
        } else if (Array.isArray(data)) {
          setBranches(data);
        }
        setIsAdmin(Boolean((data as any).isAdmin));
      } catch {
        // ignore
      } finally {
        if (!cancelled) setBranchesLoaded(true);
      }
    }
    loadBranches();
    return () => {
      cancelled = true;
    };
  }, []);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResultOriginBranches([]);
    const formData = new FormData();
    formData.append("awbNo", awbValue);
    if (originBranchId) {
      formData.append("originBranchId", originBranchId);
    }
    startTransition(async () => {
      const res = (await lookupTransactionAction(formData)) as LookupResult;
      setResult(res);
      if (res && res.found && "multiple" in res && Array.isArray(res.data)) {
        const unique = new Map<number, BranchOption>();
        for (const item of res.data) {
          if (item.originBranch && item.originBranch.id) {
            unique.set(item.originBranch.id, item.originBranch);
          } else if (item.originBranchId) {
            unique.set(item.originBranchId, {
              id: item.originBranchId,
              code: "",
              name: String(item.originBranchId),
            });
          }
        }
        if (unique.size > 0) {
          setResultOriginBranches(Array.from(unique.values()));
        }
      }
    });
  }

  const needsOriginBranch = result && !result.found && result.needsOriginBranch;
  const errorMessage =
    result && !result.found && result.error
      ? result.error
      : result && !result.found
        ? "Tidak ditemukan"
        : undefined;

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-[1fr,auto] sm:items-end">
          <div className="space-y-1">
            <Label htmlFor="awbNo">AWB No.</Label>
            <input
              id="awbNo"
              name="awbNo"
              value={awbValue}
              onChange={(e) => setAwbValue(e.target.value)}
              placeholder="Cari AWB No."
              className="w-full border rounded px-2 py-1"
              required
              aria-required="true"
            />
          </div>
          <button type="submit" disabled={isPending} className="px-3 py-1 border rounded h-9">
            {isPending ? "Mencari..." : "Cari"}
          </button>
        </div>
        <div className="space-y-1">
          <Label htmlFor="originBranchId">Cabang asal</Label>
          <Select
            value={originBranchId || "any"}
            onValueChange={(v) => setOriginBranchId(v === "any" ? "" : v)}
          >
            <SelectTrigger id="originBranchId" className="w-full sm:w-[320px]">
              <SelectValue placeholder="Semua cabang dalam cakupan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Semua cabang dalam cakupan</SelectItem>
              {(resultOriginBranches.length > 0 ? resultOriginBranches : branches).map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>
                  {b.code ? `${b.code} - ${b.name}` : b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Pilih cabang asal jika AWB ditemukan di beberapa cabang asal. Hanya cabang yang boleh diakses yang ditampilkan.
          </p>
        </div>
        {errorMessage && (
          <div className="text-sm text-destructive" role="alert" aria-live="polite">
            {errorMessage}
          </div>
        )}
      </form>
      {result && result.found && "multiple" in result && Array.isArray(result.data) && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Ditemukan {result.data.length} hasil</div>
          {result.data.map((item) => (
            <div key={item.id} className="border rounded p-4 space-y-1">
              <div className="font-medium">AWB: {item.awbNo}</div>
              <div>Status: {item.status}</div>
              <div>Tanggal: {item.transactionDate}</div>
              <div>
                Cabang asal:{" "}
                {item.originBranch
                  ? item.originBranch.code
                    ? `${item.originBranch.code} - ${item.originBranch.name}`
                    : item.originBranch.name
                  : item.originBranchId ?? "-"}
              </div>
              <div>
                Cabang tujuan:{" "}
                {item.destinationBranch
                  ? item.destinationBranch.code
                    ? `${item.destinationBranch.code} - ${item.destinationBranch.name}`
                    : item.destinationBranch.name
                  : item.destinationBranchId ?? "-"}
              </div>
              <div className="text-xs text-muted-foreground">ID Transaksi: {item.id}</div>
            </div>
          ))}
        </div>
      )}
      {result && result.found && !("multiple" in result) && !Array.isArray((result as any).data) && (
        <div className="border rounded p-4 space-y-1">
          <div className="font-medium">AWB: {(result as any).data.awbNo}</div>
          <div>Status: {(result as any).data.status}</div>
          <div>Tanggal: {(result as any).data.transactionDate}</div>
          <div>
            Cabang asal:{" "}
            {(result as any).data.originBranch
              ? (result as any).data.originBranch.code
                ? `${(result as any).data.originBranch.code} - ${(result as any).data.originBranch.name}`
                : (result as any).data.originBranch.name
              : (result as any).data.originBranchId ?? "-"}
          </div>
          <div>
            Cabang tujuan:{" "}
            {(result as any).data.destinationBranch
              ? (result as any).data.destinationBranch.code
                ? `${(result as any).data.destinationBranch.code} - ${(result as any).data.destinationBranch.name}`
                : (result as any).data.destinationBranch.name
              : (result as any).data.destinationBranchId ?? "-"}
          </div>
          <div className="text-xs text-muted-foreground">ID Transaksi: {(result as any).data.id}</div>
        </div>
      )}
      {needsOriginBranch && (
        <div className="text-sm text-muted-foreground">
          AWB ditemukan di beberapa cabang asal. Pilih cabang asal pada filter di atas lalu cari kembali.
        </div>
      )}
    </div>
  );
}
