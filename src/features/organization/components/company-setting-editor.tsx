"use client";
import { Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type {
  ReferenceCapabilities,
  ReferenceRow,
} from "@/components/patterns/reference-workspace";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  configurationDetail,
  listConfigurations,
  removeConfiguration,
  saveConfiguration,
} from "../settings-actions";
import {
  type ConfigurationKind,
  configurationForms,
} from "../settings-contracts";

export function CompanySettingEditor({
  kind,
  companyId,
  capabilities,
}: {
  kind: ConfigurationKind;
  companyId: number;
  capabilities: ReferenceCapabilities;
}) {
  const [rows, setRows] = useState<ReferenceRow[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [record, setRecord] = useState<ReferenceRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const load = useCallback(
    async (preferred?: number) => {
      setLoading(true);
      setLoaded(false);
      setError("");
      try {
        const result = await listConfigurations(kind, {
          companyId,
          page,
          pageSize: 50,
        });
        if (!result.ok) {
          setError(result.message);
          return;
        }
        if (page > result.data.pagination.totalPages) {
          setPage(result.data.pagination.totalPages);
          return;
        }
        setLoaded(true);
        setRows(result.data.items);
        setPages(result.data.pagination.totalPages);
        const first =
          result.data.items.find((item) => item.id === preferred) ??
          result.data.items[0];
        setSelected(preferred ?? first?.id ?? null);
      } catch {
        setError("Konfigurasi gagal dimuat.");
      } finally {
        setLoading(false);
      }
    },
    [kind, companyId, page],
  );
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    let cancelled = false;
    setRecord(null);
    if (selected === null) return;
    if (!capabilities.update) {
      setRecord(rows.find((row) => row.id === selected) ?? null);
      return;
    }
    setLoading(true);
    setError("");
    void configurationDetail(kind, selected)
      .then((result) => {
        if (cancelled) return;
        if (result.ok) setRecord(result.data);
        else setError(result.message);
      })
      .catch(() => {
        if (!cancelled) setError("Konfigurasi gagal dimuat.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selected, kind, capabilities.update, rows]);
  const definition = configurationForms[kind];
  const writable =
    selected === null ? capabilities.create : capabilities.update;
  const ready = loaded && (selected === null || record !== null);
  async function save(form: FormData) {
    setBusy(true);
    setError("");
    setNotice("");
    const data = {
      companyId,
      ...Object.fromEntries(
        definition.fields
          .filter((field) => field.key !== "companyId")
          .map((field) => [
            field.key,
            field.type === "boolean"
              ? form.has(field.key)
              : (form.get(field.key) ?? ""),
          ]),
      ),
    };
    try {
      const result = await saveConfiguration(
        kind,
        selected,
        data,
        record?.updatedAt,
      );
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setNotice("Konfigurasi tersimpan.");
      await load(result.data.id);
    } catch {
      setError("Konfigurasi gagal disimpan.");
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (selected === null) return;
    setBusy(true);
    setError("");
    try {
      const result = await removeConfiguration(kind, selected);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setConfirm(false);
      setNotice("Konfigurasi dihapus dari daftar aktif.");
      await load();
    } catch {
      setError("Konfigurasi gagal dihapus.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-5" aria-label={definition.label}>
      {(rows.length > 1 || pages > 1) && (
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-2">
            <Label htmlFor="setting-record">Konfigurasi</Label>
            <select
              id="setting-record"
              className="min-h-11 rounded-md border border-input bg-background px-3"
              value={selected ?? ""}
              disabled={loading || busy}
              onChange={(event) => setSelected(Number(event.target.value))}
            >
              {rows.map((row, index) => (
                <option key={row.id} value={row.id}>
                  {definition.label} {(page - 1) * 50 + index + 1}
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="outline"
            className="min-h-11"
            disabled={page <= 1 || busy || loading}
            onClick={() => setPage(page - 1)}
          >
            Sebelumnya
          </Button>
          <Button
            variant="outline"
            className="min-h-11"
            disabled={page >= pages || busy || loading}
            onClick={() => setPage(page + 1)}
          >
            Berikutnya
          </Button>
        </div>
      )}
      {loading ? (
        <output>Memuat konfigurasi…</output>
      ) : (
        <form
          key={`${selected}:${record?.updatedAt ?? "new"}`}
          onSubmit={(event) => {
            event.preventDefault();
            void save(new FormData(event.currentTarget));
          }}
          className="grid max-w-5xl gap-4 lg:grid-cols-2"
        >
          {definition.fields
            .filter((field) => field.key !== "companyId")
            .map((field) => (
              <div
                className={`grid min-w-0 gap-2 sm:grid-cols-3 sm:items-center sm:gap-5 ${["invoiceMessage", "description", "provider", "verificationEmail"].includes(field.key) ? "lg:col-span-2" : ""}`}
                key={field.key}
              >
                <Label htmlFor={`setting-${field.key}`}>
                  {field.label}
                  {field.required ? " *" : ""}
                </Label>
                {field.key === "invoiceMessage" ||
                field.key === "description" ? (
                  <Textarea
                    id={`setting-${field.key}`}
                    name={field.key}
                    defaultValue={String(record?.[field.key] ?? "")}
                    required={field.required}
                    maxLength={field.maxLength}
                    disabled={!writable || busy || !ready}
                    className="sm:col-span-2"
                  />
                ) : (
                  <Input
                    id={`setting-${field.key}`}
                    name={field.key}
                    type={field.type === "email" ? "email" : "text"}
                    defaultValue={
                      field.private && !capabilities.update
                        ? ""
                        : String(record?.[field.key] ?? "")
                    }
                    placeholder={
                      field.private && !capabilities.update
                        ? "Data terbatas"
                        : ""
                    }
                    required={field.required}
                    maxLength={field.maxLength}
                    disabled={!writable || busy || !ready}
                    className="min-h-11 sm:col-span-2"
                  />
                )}
              </div>
            ))}
          <div className="flex flex-wrap gap-2 pt-2 lg:col-span-2">
            <Button className="min-h-11" disabled={!writable || busy || !ready}>
              {busy ? "Menyimpan…" : selected ? "Update" : "Simpan"}
            </Button>
            {capabilities.create && selected !== null && (
              <Button
                type="button"
                className="min-h-11"
                variant="default"
                disabled={busy}
                onClick={() => {
                  setSelected(null);
                  setError("");
                  setNotice("");
                }}
              >
                <Plus aria-hidden="true" />
                Tambah konfigurasi
              </Button>
            )}
            {capabilities.delete && selected !== null && (
              <Button
                type="button"
                className="min-h-11"
                variant="destructive"
                disabled={busy}
                onClick={() => setConfirm(true)}
              >
                <Trash2 aria-hidden="true" />
                Hapus konfigurasi
              </Button>
            )}
          </div>
        </form>
      )}
      {error && (
        <div className="space-y-2">
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
          <Button
            className="min-h-11"
            variant="outline"
            onClick={() => void load(selected ?? undefined)}
          >
            Coba lagi
          </Button>
        </div>
      )}
      {notice && <output>{notice}</output>}
      <Dialog
        open={confirm}
        onOpenChange={(value) => {
          if (!busy) setConfirm(value);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus {definition.label}</DialogTitle>
            <DialogDescription>
              Hapus konfigurasi dari daftar aktif? Riwayat tetap dipertahankan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setConfirm(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => void remove()}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
