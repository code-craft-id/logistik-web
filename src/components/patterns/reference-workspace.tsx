"use client";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { SearchSelect } from "@/components/patterns/search-select";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
export type ReferenceField = {
  key: string;
  label: string;
  type: "text" | "email" | "date" | "integer" | "boolean" | "choice";
  required?: boolean;
  private?: boolean;
  table?: boolean;
  maxLength?: number;
  choice?: string;
};
export type ReferenceRow = {
  id: number;
  name: string;
  updatedAt: Date;
  [key: string]: unknown;
};
export type ReferenceCapabilities = Partial<
  Record<"create" | "update" | "delete", boolean>
>;
export type ReferenceDefinition = {
  label: string;
  fields: ReferenceField[];
  status?: boolean;
};
type Result<T> = { ok: true; data: T } | { ok: false; message: string };
export type ReferenceApi = {
  list: (
    kind: string,
    input: unknown,
  ) => Promise<
    Result<{
      items: ReferenceRow[];
      pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
      };
    }>
  >;
  detail: (kind: string, id: number) => Promise<Result<ReferenceRow>>;
  save: (
    kind: string,
    id: number | null,
    input: unknown,
    version?: unknown,
  ) => Promise<Result<{ id: number }>>;
  remove: (kind: string, id: number) => Promise<Result<{ success: boolean }>>;
  choices: (
    kind: string,
    type: unknown,
    input: unknown,
  ) => Promise<
    Result<{
      items: { id: number; name: string }[];
      page: number;
      totalPages: number;
    }>
  >;
};
function display(value: unknown) {
  return value instanceof Date
    ? value.toISOString().slice(0, 10)
    : value === null || value === undefined || value === ""
      ? "—"
      : typeof value === "boolean"
        ? value
          ? "Ya"
          : "Tidak"
        : String(value);
}
export function ReferenceWorkspace({
  kind,
  capabilities,
  definition,
  api,
  fixedValues,
}: {
  fixedValues?: Record<string, number>;
  kind: string;
  capabilities: ReferenceCapabilities;
  definition: ReferenceDefinition;
  api: ReferenceApi;
}) {
  const config = definition;
  const [choiceReady, setChoiceReady] = useState<Record<string, boolean>>({});
  const onChoiceReady = useCallback(
    (key: string, ready: boolean) =>
      setChoiceReady((previous) =>
        previous[key] === ready ? previous : { ...previous, [key]: ready },
      ),
    [],
  );
  const choicesReady = config.fields
    .filter(
      (field) =>
        field.type === "choice" && fixedValues?.[field.key] === undefined,
    )
    .every((field) => choiceReady[field.key]);
  const fields = config.fields.filter(
    (field) =>
      !field.private &&
      field.table !== false &&
      fixedValues?.[field.key] === undefined,
  );
  const [items, setItems] = useState<ReferenceRow[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortDirection, setSortDirection] = useState("asc");
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<ReferenceRow | null | undefined>(
    undefined,
  );
  const [removing, setRemoving] = useState<ReferenceRow | null>(null);
  const generation = useRef(0);
  const dialogTrigger = useRef<HTMLButtonElement | null>(null);
  const listHeading = useRef<HTMLHeadingElement | null>(null);
  const restoreFocus = (event: Event) => {
    event.preventDefault();
    (dialogTrigger.current?.isConnected
      ? dialogTrigger.current
      : listHeading.current
    )?.focus();
  };
  const load = useCallback(async () => {
    const request = ++generation.current;
    setLoading(true);
    setError("");
    try {
      const result = await api.list(kind, {
        ...fixedValues,
        page,
        pageSize,
        sortDirection,
        search: filter,
        ...(config.status !== false && status ? { status } : {}),
      });
      if (request !== generation.current) return;
      if (!result.ok) {
        setError(result.message);
        return;
      }
      if (page > result.data.pagination.totalPages) {
        setPage(result.data.pagination.totalPages);
        return;
      }
      setItems(result.data.items);
      setTotal(result.data.pagination.total);
      setPages(result.data.pagination.totalPages);
    } catch {
      if (request === generation.current)
        setError("Data gagal dimuat. Silakan coba lagi.");
    } finally {
      if (request === generation.current) setLoading(false);
    }
  }, [
    api,
    kind,
    page,
    pageSize,
    sortDirection,
    filter,
    status,
    config.status,
    fixedValues,
  ]);
  useEffect(() => {
    void load();
    return () => {
      generation.current += 1;
    };
  }, [load]);
  async function edit(id: number) {
    setNotice("");
    setBusy(true);
    setError("");
    try {
      const result = await api.detail(kind, id);
      if (result.ok) setEditing(result.data);
      else setError(result.message);
    } catch {
      setError("Data gagal dimuat.");
    } finally {
      setBusy(false);
    }
  }
  async function save(form: FormData) {
    setNotice("");
    if (!choicesReady) {
      setError("Tunggu pilihan terkait selesai dimuat.");
      return;
    }
    setBusy(true);
    setError("");
    const data = Object.fromEntries(
      config.fields.map((field) => [
        field.key,
        field.type === "boolean"
          ? form.has(field.key)
          : field.type === "choice" || field.type === "date"
            ? form.get(field.key) || null
            : (form.get(field.key) ?? ""),
      ]),
    );
    Object.assign(data, fixedValues);
    if (config.status !== false) data.status = form.get("status") ?? "ACTIVE";
    try {
      const result = await api.save(
        kind,
        editing?.id ?? null,
        data,
        editing?.updatedAt,
      );
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setEditing(undefined);
      setNotice("Data tersimpan.");
      await load();
    } catch {
      setError("Data gagal disimpan. Silakan coba lagi.");
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setNotice("");
    if (!removing) return;
    setBusy(true);
    setError("");
    try {
      const result = await api.remove(kind, removing.id);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setRemoving(null);
      setNotice("Data dihapus dari daftar aktif; riwayat dipertahankan.");
      await load();
    } catch {
      setError("Data gagal dihapus.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-4" aria-label={config.label}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 ref={listHeading} tabIndex={-1} className="text-lg font-semibold">
          {config.label}
        </h2>
        {capabilities.create && (
          <Button
            className="min-h-11"
            disabled={busy}
            onClick={(event) => {
              dialogTrigger.current = event.currentTarget;
              setError("");
              setEditing(null);
            }}
          >
            <Plus aria-hidden="true" />
            Tambah {config.label}
          </Button>
        )}
      </div>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setFilter(search);
        }}
      >
        <div className="space-y-2">
          <Label htmlFor={`master-search-${kind}`}>Cari nama</Label>
          <Input
            className="min-h-11"
            id={`master-search-${kind}`}
            value={search}
            maxLength={100}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        {config.status !== false && (
          <div className="space-y-2">
            <Label htmlFor={`master-status-${kind}`}>Status</Label>
            <select
              id={`master-status-${kind}`}
              className="min-h-11 rounded-md border border-input bg-background px-3"
              value={status}
              onChange={(event) => {
                setPage(1);
                setStatus(event.target.value);
              }}
            >
              <option value="">Semua</option>
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Tidak aktif</option>
            </select>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor={`page-size-${kind}`}>Jumlah per halaman</Label>
          <select
            id={`page-size-${kind}`}
            value={pageSize}
            className="min-h-11 rounded-md border border-input bg-background px-3"
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`sort-${kind}`}>Urutan</Label>
          <select
            id={`sort-${kind}`}
            value={sortDirection}
            className="min-h-11 rounded-md border border-input bg-background px-3"
            onChange={(event) => {
              setSortDirection(event.target.value);
              setPage(1);
            }}
          >
            <option value="asc">A–Z</option>
            <option value="desc">Z–A</option>
          </select>
        </div>
        <Button type="submit" className="min-h-11">
          Cari
        </Button>
      </form>
      {notice && <output className="block text-sm">{notice}</output>}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {loading ? (
        <output>Memuat data…</output>
      ) : error && editing === undefined && !removing ? (
        <Button
          className="min-h-11"
          variant="outline"
          onClick={() => void load()}
        >
          Coba lagi
        </Button>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">No.</TableHead>
                {fields.map((field) => (
                  <TableHead scope="col" key={field.key}>
                    {field.label}
                  </TableHead>
                ))}
                {config.status !== false && (
                  <TableHead scope="col">Status</TableHead>
                )}
                <TableHead scope="col">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
                  {fields.map((field) => (
                    <TableCell key={field.key}>
                      {display(row[`${field.key}Label`] ?? row[field.key])}
                    </TableCell>
                  ))}
                  {config.status !== false && (
                    <TableCell>
                      {row.status === "ACTIVE" ? "Aktif" : "Tidak aktif"}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex gap-2">
                      {capabilities.update && (
                        <Button
                          variant="default"
                          className="min-h-11"
                          disabled={busy}
                          aria-label={`Edit ${config.label} ${row.name}`}
                          onClick={(event) => {
                            dialogTrigger.current = event.currentTarget;
                            void edit(row.id);
                          }}
                        >
                          <Pencil aria-hidden="true" />
                          Edit
                        </Button>
                      )}
                      {capabilities.delete && (
                        <Button
                          variant="destructive"
                          aria-label={`Hapus ${config.label} ${row.name}`}
                          className="min-h-11"
                          disabled={busy}
                          onClick={(event) => {
                            dialogTrigger.current = event.currentTarget;
                            setError("");
                            setRemoving(row);
                          }}
                        >
                          <Trash2 aria-hidden="true" />
                          Hapus
                        </Button>
                      )}
                      {!capabilities.update &&
                        !capabilities.delete &&
                        "Hanya baca"}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!items.length && (
                <TableRow>
                  <TableCell
                    colSpan={fields.length + (config.status === false ? 2 : 3)}
                  >
                    Tidak ada data yang sesuai.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              {total} data · Halaman {page} dari {pages}
            </p>
            <div className="flex gap-2">
              <Button
                className="min-h-11"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Sebelumnya
              </Button>
              <Button
                className="min-h-11"
                variant="outline"
                disabled={page >= pages}
                onClick={() => setPage(page + 1)}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        </>
      )}
      <Dialog
        open={editing !== undefined}
        onOpenChange={(open) => {
          if (!open && !busy) setEditing(undefined);
        }}
      >
        <DialogContent
          onCloseAutoFocus={restoreFocus}
          className="max-h-dvh overflow-y-auto sm:max-w-2xl"
        >
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit" : "Tambah"} {config.label}
            </DialogTitle>
            <DialogDescription>
              Perubahan akan disimpan ke data {config.label.toLowerCase()}.
            </DialogDescription>
          </DialogHeader>
          <form action={save} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {config.fields
                .filter((field) => fixedValues?.[field.key] === undefined)
                .map((field) => (
                  <MasterFormField
                    key={field.key}
                    field={field}
                    api={api}
                    kind={kind}
                    row={editing}
                    onChoiceReady={onChoiceReady}
                    disabled={busy}
                  />
                ))}
              {config.status !== false && (
                <div className="space-y-2">
                  <Label htmlFor="record-status">Status</Label>
                  <select
                    id="record-status"
                    name="status"
                    className="min-h-11 w-full rounded-md border border-input bg-background px-3"
                    defaultValue={String(editing?.status ?? "ACTIVE")}
                    disabled={busy}
                  >
                    <option value="ACTIVE">Aktif</option>
                    <option value="INACTIVE">Tidak aktif</option>
                  </select>
                </div>
              )}
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button
                className="min-h-11"
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setEditing(undefined)}
              >
                Batal
              </Button>
              <Button
                className="min-h-11"
                type="submit"
                disabled={busy || !choicesReady}
              >
                {busy ? "Menyimpan…" : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!removing}
        onOpenChange={(open) => {
          if (!open && !busy) setRemoving(null);
        }}
      >
        <DialogContent onCloseAutoFocus={restoreFocus}>
          <DialogHeader>
            <DialogTitle>Hapus {config.label}</DialogTitle>
            <DialogDescription>
              Hapus {removing?.name} dari daftar aktif? Referensi dan riwayat
              tetap tersimpan.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              className="min-h-11"
              variant="outline"
              disabled={busy}
              onClick={() => setRemoving(null)}
            >
              Batal
            </Button>
            <Button
              className="min-h-11"
              variant="destructive"
              disabled={busy}
              onClick={() => void remove()}
            >
              {busy ? "Menghapus…" : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
function MasterFormField({
  field,
  kind,
  row,
  disabled,
  onChoiceReady,
  api,
}: {
  field: ReferenceField;
  kind: string;
  row: ReferenceRow | null | undefined;
  disabled: boolean;
  onChoiceReady: (key: string, ready: boolean) => void;
  api: ReferenceApi;
}) {
  const id = `master-${field.key}`;
  const value = row?.[field.key];
  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className={
          field.type === "boolean" ? "flex min-h-11 items-center" : undefined
        }
      >
        {field.label}
        {field.required ? " *" : ""}
      </Label>
      {field.type === "choice" ? (
        <MasterChoice
          field={field}
          kind={kind}
          value={value}
          label={String(row?.[`${field.key}Label`] ?? "")}
          disabled={disabled}
          onChoiceReady={onChoiceReady}
          api={api}
        />
      ) : field.type === "boolean" ? (
        <input
          className="size-5"
          id={id}
          name={field.key}
          type="checkbox"
          defaultChecked={Boolean(value)}
          disabled={disabled}
        />
      ) : (
        <Input
          className="min-h-11"
          id={id}
          name={field.key}
          type={
            field.type === "integer"
              ? "number"
              : field.type === "email"
                ? "email"
                : field.type === "date"
                  ? "date"
                  : "text"
          }
          defaultValue={
            value === null || value === undefined
              ? ""
              : value instanceof Date
                ? value.toISOString().slice(0, 10)
                : String(value)
          }
          required={field.required}
          maxLength={field.maxLength}
          min={field.type === "integer" ? 0 : undefined}
          max={field.type === "integer" ? 9999 : undefined}
          disabled={disabled}
        />
      )}
    </div>
  );
}
function MasterChoice({
  field,
  kind,
  value,
  label,
  disabled,
  onChoiceReady,
  api,
}: {
  field: ReferenceField;
  kind: string;
  value: unknown;
  label: string;
  disabled: boolean;
  onChoiceReady: (key: string, ready: boolean) => void;
  api: ReferenceApi;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [choices, setChoices] = useState<{ id: number; name: string }[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(
    value === null || value === undefined ? "" : String(value),
  );
  const [selectedLabel, setSelectedLabel] = useState(
    label || (selected ? `ID ${selected} (pilihan saat ini)` : ""),
  );
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    void api
      .choices(kind, field.choice, { search, page, pageSize: 50 })
      .then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setChoices(result.data.items);
          setPages(result.data.totalPages);
        } else setError(result.message);
      })
      .catch(() => {
        if (!cancelled) setError("Pilihan gagal dimuat.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, kind, field.choice, search, page]);
  useEffect(() => {
    onChoiceReady(field.key, !loading && !error);
    return () => onChoiceReady(field.key, false);
  }, [field.key, loading, error, onChoiceReady]);
  return (
    <SearchSelect
      id={`master-${field.key}`}
      name={field.key}
      label={field.label}
      value={selected}
      selectedLabel={selectedLabel}
      options={choices}
      search={search}
      onSearchChange={(value) => {
        setSearch(value);
        setPage(1);
      }}
      onValueChange={(value, name) => {
        setSelected(value);
        setSelectedLabel(name);
      }}
      disabled={disabled}
      loading={loading}
      error={error}
      required={field.required}
      page={page}
      pages={pages}
      onPageChange={setPage}
    />
  );
}
