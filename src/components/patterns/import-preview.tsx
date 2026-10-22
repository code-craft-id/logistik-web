"use client";

import { FileUp } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ImportPreview() {
  const id = useId();
  const [filename, setFilename] = useState("");
  const [error, setError] = useState("");
  const select = (name: string) => {
    setFilename(name);
    setError(
      name && !name.toLowerCase().endsWith(".xlsx")
        ? "Hanya file Excel (.xlsx) yang diperbolehkan. No import was performed."
        : "",
    );
  };
  return (
    <div className="space-y-4">
      <section
        aria-label="Local import file selection"
        className="rounded-xl border border-dashed bg-muted/50 p-6"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          select(event.dataTransfer.files[0]?.name ?? "");
        }}
      >
        <FileUp
          className="mx-auto mb-3 size-8 text-primary"
          aria-hidden="true"
        />
        <p className="mb-2 text-center text-sm font-medium">
          Drag & Drop file Excel ke area ini
        </p>
        <p className="mb-4 text-center text-sm text-muted-foreground">
          Atau pilih file dari perangkat Anda. Filename preview only; file
          contents are not read or uploaded.
        </p>
        <Label htmlFor={id} className="mb-2 block">
          Browse File (.xlsx)
        </Label>
        <Input
          id={id}
          type="file"
          accept=".xlsx"
          className="min-h-11"
          onChange={(event) =>
            select(event.currentTarget.files?.[0]?.name ?? "")
          }
        />
        <output className="mt-3 block text-sm" aria-live="polite">
          {filename ? `File: ${filename}` : "No file selected."}
        </output>
      </section>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="space-y-2 rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">
          Upload unavailable — awaiting the approved import workflow.
        </p>
        <progress
          aria-label="Upload unavailable"
          max={100}
          value={0}
          className="h-2 w-full accent-primary"
        />
      </div>
      <dl className="grid gap-3 sm:grid-cols-3">
        {["Rows", "Imported", "Failed"].map((label) => (
          <div key={label} className="rounded-lg border p-3">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="mt-1 font-medium">Unavailable</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap gap-2">
        <Button disabled className="min-h-11">
          Upload — unavailable
        </Button>
        <Button disabled variant="outline" className="min-h-11">
          Download failed rows — unavailable
        </Button>
      </div>
    </div>
  );
}
