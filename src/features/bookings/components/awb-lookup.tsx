"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { lookupTransactionAction } from "../lookup-actions";

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

function isMultipleResult(
  result: LookupResult,
): result is { found: true; multiple: true; data: LookupData[] } {
  return result.found && "multiple" in result && result.multiple === true;
}

function isSingleResult(
  result: LookupResult,
): result is { found: true; data: LookupData } {
  return result.found && !isMultipleResult(result);
}

function formatBranch(
  branch: BranchOption | null | undefined,
  branchId: number | null | undefined,
): string {
  if (branch) {
    return branch.code ? `${branch.code} - ${branch.name}` : branch.name;
  }
  return branchId != null ? String(branchId) : "-";
}

export function AwbLookup() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<LookupResult | null>(null);
  const [awbValue, setAwbValue] = useState("");
  const [originBranchId, setOriginBranchId] = useState<string>("");
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [resultOriginBranches, setResultOriginBranches] = useState<
    BranchOption[]
  >([]);
  const requestIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    async function loadBranches() {
      try {
        const res = await fetch("/api/identity/branches/me", {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (cancelled) return;
          if (Array.isArray(data.branches)) {
            setBranches(data.branches);
            return;
          }
        }
        const fallback = await fetch("/api/user-management/branches", {
          cache: "no-store",
        });
        if (!fallback.ok) return;
        const data = await fallback.json();
        if (cancelled) return;
        if (Array.isArray(data.branches)) {
          setBranches(data.branches);
        } else if (Array.isArray(data)) {
          setBranches(data);
        }
      } catch {
        // ignore
      }
    }
    loadBranches();
    return () => {
      cancelled = true;
    };
  }, []);

  function onAwbChange(value: string) {
    // Invalidate any in-flight lookup so a late response cannot repopulate
    // results for the previous AWB (PR #9 regression).
    requestIdRef.current += 1;
    setAwbValue(value);
    // Reset origin filter and previous results when AWB changes.
    setOriginBranchId("");
    setResultOriginBranches([]);
    setResult(null);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const requestId = ++requestIdRef.current;
    setResultOriginBranches([]);
    const formData = new FormData();
    formData.append("awbNo", awbValue);
    if (originBranchId) {
      formData.append("originBranchId", originBranchId);
    }
    startTransition(async () => {
      const res = (await lookupTransactionAction(formData)) as LookupResult;
      // Ignore stale responses if a newer request was issued or input changed.
      if (requestId !== requestIdRef.current) return;
      setResult(res);
      if (isMultipleResult(res)) {
        const unique = new Map<number, BranchOption>();
        for (const item of res.data) {
          if (item.originBranch?.id) {
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

  const baseBranchOptions =
    resultOriginBranches.length > 0 ? resultOriginBranches : branches;
  const branchOptions = (() => {
    if (!originBranchId) return baseBranchOptions;
    const selectedId = Number(originBranchId);
    if (Number.isNaN(selectedId)) return baseBranchOptions;
    if (baseBranchOptions.some((b) => b.id === selectedId))
      return baseBranchOptions;
    return [
      ...baseBranchOptions,
      { id: selectedId, code: "", name: `Cabang ${selectedId}` },
    ];
  })();

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
              onChange={(e) => onAwbChange(e.target.value)}
              placeholder="Cari AWB No."
              className="w-full border rounded px-2 py-1"
              required
              aria-required="true"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="px-3 py-1 border rounded h-9"
          >
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
              {branchOptions.map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>
                  {b.code ? `${b.code} - ${b.name}` : b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Pilih cabang asal jika AWB ditemukan di beberapa cabang asal. Hanya
            cabang yang boleh diakses yang ditampilkan.
          </p>
        </div>
        {errorMessage && (
          <div
            className="text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            {errorMessage}
          </div>
        )}
      </form>
      {result && isMultipleResult(result) && (
        <div className="space-y-2">
          <div className="text-sm font-medium">
            Ditemukan {result.data.length} hasil
          </div>
          {result.data.map((item) => (
            <div key={item.id} className="border rounded p-4 space-y-1">
              <div className="font-medium">AWB: {item.awbNo}</div>
              <div>Status: {item.status}</div>
              <div>Tanggal: {item.transactionDate}</div>
              <div>
                Cabang asal:{" "}
                {formatBranch(item.originBranch, item.originBranchId)}
              </div>
              <div>
                Cabang tujuan:{" "}
                {formatBranch(item.destinationBranch, item.destinationBranchId)}
              </div>
              <div className="text-xs text-muted-foreground">
                ID Transaksi: {item.id}
              </div>
            </div>
          ))}
        </div>
      )}
      {result && isSingleResult(result) && (
        <div className="border rounded p-4 space-y-1">
          <div className="font-medium">AWB: {result.data.awbNo}</div>
          <div>Status: {result.data.status}</div>
          <div>Tanggal: {result.data.transactionDate}</div>
          <div>
            Cabang asal:{" "}
            {formatBranch(result.data.originBranch, result.data.originBranchId)}
          </div>
          <div>
            Cabang tujuan:{" "}
            {formatBranch(
              result.data.destinationBranch,
              result.data.destinationBranchId,
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            ID Transaksi: {result.data.id}
          </div>
        </div>
      )}
      {needsOriginBranch && (
        <div className="text-sm text-muted-foreground">
          AWB ditemukan di beberapa cabang asal. Pilih cabang asal pada filter
          di atas lalu cari kembali.
        </div>
      )}
    </div>
  );
}
