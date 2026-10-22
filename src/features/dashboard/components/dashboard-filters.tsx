"use client";

import { RotateCcw, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const emptySelection = { period: "", date: "", year: "" };

export function DashboardFilters() {
  const [selection, setSelection] = useState(emptySelection);
  const [applied, setApplied] = useState<typeof emptySelection | null>(null);
  return (
    <form
      aria-label="Dashboard preview filters"
      aria-describedby="dashboard-filter-help"
      onSubmit={(event) => {
        event.preventDefault();
        setApplied({ ...selection });
      }}
      onReset={() => {
        setSelection(emptySelection);
        setApplied(null);
      }}
    >
      <p
        id="dashboard-filter-help"
        className="mb-4 text-sm text-muted-foreground"
      >
        Local preview only. Show applies the selection below; operational data
        and branch access are unavailable. No records are loaded or saved.
      </p>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
        <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="min-w-0 space-y-2">
            <Label htmlFor="dashboard-period">Periode (month)</Label>
            <Input
              id="dashboard-period"
              type="month"
              className="min-h-11 w-full min-w-0"
              value={selection.period}
              onInput={(event) =>
                setSelection({
                  ...selection,
                  period: event.currentTarget.value,
                })
              }
            />
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor="dashboard-date">Tanggal (date)</Label>
            <Input
              id="dashboard-date"
              type="date"
              className="min-h-11 w-full min-w-0"
              value={selection.date}
              onInput={(event) =>
                setSelection({ ...selection, date: event.currentTarget.value })
              }
            />
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor="dashboard-year">Tahun (year)</Label>
            <Input
              id="dashboard-year"
              type="number"
              min="1"
              max="9999"
              step="1"
              placeholder="Year"
              className="min-h-11"
              value={selection.year}
              onInput={(event) =>
                setSelection({ ...selection, year: event.currentTarget.value })
              }
            />
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor="dashboard-branch">Cabang (branch)</Label>
            <select
              id="dashboard-branch"
              disabled
              aria-describedby="dashboard-filter-help"
              className="min-h-11 w-full rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground"
            >
              <option>Unavailable — PLT-01</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" className="min-h-11">
            <Search aria-hidden="true" />
            Show
          </Button>
          <Button type="reset" variant="outline" className="min-h-11">
            <RotateCcw aria-hidden="true" />
            Reset
          </Button>
        </div>
      </div>
      <output
        className="mt-4 block text-sm text-muted-foreground"
        aria-live="polite"
      >
        {applied
          ? `Preview selection: period ${applied.period || "not selected"}; date ${applied.date || "not selected"}; year ${applied.year || "not selected"}. Data remains unavailable.`
          : "No preview selection applied."}
      </output>
    </form>
  );
}
