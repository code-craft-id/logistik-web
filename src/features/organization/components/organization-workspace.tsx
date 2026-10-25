"use client";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Tabs } from "radix-ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  listOrganizations,
  removeOrganization,
  saveOrganization,
} from "../actions";
import { type OrganizationKind, organizationForms } from "../contracts";
import { screens } from "../preview/screens";
import type { ConfigurationKind } from "../settings-contracts";
import { CompanyLogoField } from "./company-logo-field";
import { ConfigurationWorkspace } from "./configuration-workspace";

type Row = { id: number; name: string; [key: string]: unknown };
const companySettings: Record<string, ConfigurationKind> = {
  "tanda-tangan-invoice": "company_invoice",
  "data-bank": "company_bank",
  "dompet-digital": "company_wallet",
  "wa-notifikasi": "whatsapp_configuration",
};
export function OrganizationWorkspace({
  resources,
  section,
}: {
  resources?: string[];
  section?: OrganizationKind;
}) {
  const [active, setActive] = useState(
    section
      ? {
          company: "perusahaan",
          office: "kantor",
          branch: "kantor-cabang",
          agent: "agen",
        }[section]
      : "perusahaan",
  );
  const [companyTab, setCompanyTab] = useState("data-perusahaan");
  const source = screens["/office"];
  const allowed = (resource: string) =>
    !resources || resources.includes(resource);
  const views = useMemo(
    () =>
      source.views
        .filter(
          (view) =>
            !section ||
            view.id ===
              {
                company: "perusahaan",
                office: "kantor",
                branch: "kantor-cabang",
                agent: "agen",
              }[section],
        )
        .filter((view) =>
          view.id === "perusahaan"
            ? ["company", ...Object.values(companySettings)].some(
                (resource) => !resources || resources.includes(resource),
              )
            : !resources ||
              resources.includes(
                (
                  {
                    kantor: "office",
                    "kantor-cabang": "branch",
                    agen: "agent",
                  } as Record<string, string>
                )[view.id],
              ),
        ),
    [resources, source.views, section],
  );
  const company = source.views[0];
  const companyChildren = useMemo(
    () =>
      (company.children ?? []).filter(
        (view) =>
          !resources ||
          resources.includes(
            view.id === "data-perusahaan"
              ? "company"
              : companySettings[view.id],
          ),
      ),
    [resources, company.children],
  );
  const selected = views.some((view) => view.id === active)
    ? active
    : views[0]?.id;
  const selectedCompany = companyChildren.some((view) => view.id === companyTab)
    ? companyTab
    : companyChildren[0]?.id;
  useEffect(() => {
    const update = () => {
      let hash: string;
      try {
        hash = decodeURIComponent(window.location.hash.slice(1));
      } catch {
        return;
      }
      const parent = views.find(
        (view) =>
          view.id === hash ||
          ("children" in view &&
            view.children?.some((child) => child.id === hash)),
      );
      if (parent) setActive(parent.id);
      if (companyChildren.some((child) => child.id === hash))
        setCompanyTab(hash);
    };
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, [views, companyChildren]);
  function select(value: string) {
    setActive(value);
    history.replaceState(null, "", `#${value}`);
  }
  return (
    <div className="space-y-5 rounded-md border bg-background p-4 sm:p-6">
      <h1 className="border-l-4 border-primary pl-3 text-lg font-semibold">
        {section ? organizationForms[section].label : "Kantor"}
      </h1>
      <Tabs.Root value={selected} onValueChange={select}>
        {!section && (
          <Tabs.List
            aria-label="Kantor sections"
            className="flex flex-wrap gap-1 border-b"
          >
            {views.map((view) => (
              <Tabs.Trigger
                key={view.id}
                value={view.id}
                className="min-h-11 border-b-2 border-transparent px-4 py-2 text-sm font-medium data-[state=active]:border-primary data-[state=active]:text-primary"
              >
                {view.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        )}
        <Tabs.Content value="perusahaan" className="pt-4">
          <Tabs.Root
            value={selectedCompany}
            onValueChange={(value) => {
              setCompanyTab(value);
              history.replaceState(null, "", `#${value}`);
            }}
          >
            <Tabs.List
              aria-label="Perusahaan subsections"
              className="mb-4 flex flex-wrap gap-2"
            >
              {companyChildren.map((view) => (
                <Tabs.Trigger
                  key={view.id}
                  value={view.id}
                  className="min-h-11 border-b-2 border-transparent px-3 py-2 text-sm data-[state=active]:border-primary data-[state=active]:text-primary"
                >
                  {view.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            {allowed("company") && (
              <Tabs.Content value="data-perusahaan">
                <OrganizationList kind="company" direct={!!section} />
              </Tabs.Content>
            )}
            {companyChildren
              .filter((view) => view.id !== "data-perusahaan")
              .map((view) => (
                <Tabs.Content key={view.id} value={view.id}>
                  <ConfigurationWorkspace
                    kind={companySettings[view.id]}
                    autoSelectCompany={!!section}
                  />
                </Tabs.Content>
              ))}
          </Tabs.Root>
        </Tabs.Content>
        <Tabs.Content value="kantor" className="pt-4">
          <OrganizationList kind="office" />
        </Tabs.Content>
        <Tabs.Content value="kantor-cabang" className="pt-4">
          <OrganizationList kind="branch" />
        </Tabs.Content>
        <Tabs.Content value="agen" className="pt-4">
          <OrganizationList kind="agent" />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
function OrganizationList({
  kind,
  direct = false,
}: {
  kind: OrganizationKind;
  direct?: boolean;
}) {
  "use no memo";
  // Avoid excessive compiler work on this large interactive editor.
  const config = organizationForms[kind];
  const formFields =
    kind === "company"
      ? [
          ...config.fields.filter((field) => field.key !== "logo"),
          ...config.fields.filter((field) => field.key === "logo"),
        ]
      : config.fields;
  const [items, setItems] = useState<Row[]>([]);
  const [parents, setParents] = useState<Row[]>([]);
  const [parentSearch, setParentSearch] = useState("");
  const [parentPage, setParentPage] = useState(1);
  const [parentPages, setParentPages] = useState(1);
  const [parentSelection, setParentSelection] = useState("");
  const [parentLabel, setParentLabel] = useState("");
  const [parentLoading, setParentLoading] = useState(false);
  const [parentError, setParentError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortDirection, setSortDirection] = useState("asc");
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [writable, setWritable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<Row | null | undefined>(undefined);
  const [removing, setRemoving] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
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
      const response = await listOrganizations(kind, {
        page,
        pageSize,
        sortDirection,
        search: filter,
        ...(status ? { status } : {}),
      });
      if (request !== generation.current) return;
      if (!response.ok) {
        setError(response.message);
        return;
      }
      if (page > response.data.pagination.totalPages) {
        setPage(response.data.pagination.totalPages);
        return;
      }
      setItems(response.data.items);
      setTotal(response.data.pagination.total);
      setTotalPages(response.data.pagination.totalPages);
      setWritable(response.data.writable);
      if (direct)
        setEditing(
          (previous) =>
            response.data.items.find((item) => item.id === previous?.id) ??
            response.data.items[0] ??
            null,
        );
    } catch {
      if (request === generation.current)
        setError("Data gagal dimuat. Silakan coba lagi.");
    } finally {
      if (request === generation.current) setLoading(false);
    }
  }, [kind, page, pageSize, sortDirection, filter, status, direct]);
  useEffect(() => {
    void load();
    return () => {
      generation.current += 1;
    };
  }, [load]);
  useEffect(() => {
    const key = config.fields.find((field) => field.type === "parent")?.key;
    const value = key && editing?.[key] ? String(editing[key]) : "";
    setParentSelection(value);
    setParentLabel(
      value
        ? String(editing?.[`${key}Label`] ?? `ID ${value} (pilihan saat ini)`)
        : "",
    );
  }, [editing, config.fields]);
  useEffect(() => {
    let cancelled = false;
    if (editing === undefined || !config.parent) return;
    setParentLoading(true);
    setParentError("");
    void listOrganizations(config.parent, {
      page: parentPage,
      pageSize: 50,
      search: parentSearch,
      ...(config.parent !== "company" ? { status: "ACTIVE" } : {}),
    })
      .then((response) => {
        if (cancelled) return;
        if (response.ok) {
          setParents(response.data.items);
          setParentPages(response.data.pagination.totalPages);
        } else setParentError(response.message);
      })
      .catch(() => {
        if (!cancelled) setParentError("Pilihan induk gagal dimuat.");
      })
      .finally(() => {
        if (!cancelled) setParentLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [config.parent, editing, parentPage, parentSearch]);
  async function submit(form: FormData) {
    if (parentLoading || parentError) return;
    setBusy(true);
    setError("");
    const input = Object.fromEntries(
      config.fields.map((field) => [
        field.key,
        field.type === "checkbox"
          ? form.has(field.key)
          : field.type === "parent"
            ? form.get(field.key)
            : form.get(field.key) ||
              (field.type === "status" ? "ACTIVE" : (field.emptyValue ?? null)),
      ]),
    );
    try {
      const response = await saveOrganization(
        kind,
        editing?.id ?? null,
        input,
        editing?.updatedAt,
      );
      if (!response.ok) {
        setError(response.message);
        return;
      }
      setEditing(undefined);
      setNotice("Data tersimpan.");
      await load();
      if (direct) {
        const refreshed = await listOrganizations(kind, {
          id: response.data.id,
        });
        if (refreshed.ok) setEditing(refreshed.data.items[0] ?? null);
      }
    } catch {
      setError("Data gagal disimpan. Silakan coba lagi.");
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!removing) return;
    setBusy(true);
    setError("");
    try {
      const response = await removeOrganization(kind, removing.id);
      if (!response.ok) {
        setError(response.message);
        return;
      }
      setRemoving(null);
      setNotice("Data dihapus dari daftar aktif; riwayat tetap tersimpan.");
      await load();
    } catch {
      setError("Data gagal dihapus.");
    } finally {
      setBusy(false);
    }
  }
  const fields = config.fields.filter((field) => field.table);
  const deleteDialog = (
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
            Hapus {removing?.name} dari daftar? Referensi dan riwayat
            dipertahankan.
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
  );
  const editor = (
    <section aria-label={`Form ${config.label}`} className="space-y-5">
      {!direct && (
        <div className="space-y-2">
          <h2 ref={listHeading} tabIndex={-1} className="text-lg font-semibold">
            {direct ? "Data" : editing ? "Edit" : "Tambah"} {config.label}
          </h2>
          <p className="text-sm text-muted-foreground">
            Perubahan disimpan ke data organisasi.
          </p>
        </div>
      )}
      <form
        key={editing?.id ?? "new"}
        onSubmit={(event) => {
          event.preventDefault();
          void submit(new FormData(event.currentTarget));
        }}
        className="space-y-5"
      >
        <div className="grid max-w-5xl gap-4 lg:grid-cols-2">
          {formFields.map((field) => (
            <div
              className={`grid min-w-0 gap-2 sm:grid-cols-3 sm:items-center sm:gap-5 ${["name", "address", "logo"].includes(field.key) ? "lg:col-span-2" : ""}`}
              key={field.key}
            >
              <Label
                htmlFor={`org-${field.key}`}
                className={
                  field.type === "checkbox"
                    ? "flex min-h-11 items-center"
                    : undefined
                }
              >
                {field.label}
                {field.required ? " *" : ""}
              </Label>
              {field.key === "logo" ? (
                <CompanyLogoField
                  key={editing?.id ?? "new"}
                  value={String(editing?.logo ?? "")}
                  disabled={busy || !writable}
                />
              ) : field.key === "address" ? (
                <Textarea
                  className="min-h-20 sm:col-span-2"
                  id={`org-${field.key}`}
                  name={field.key}
                  defaultValue={String(editing?.[field.key] ?? "")}
                  maxLength={1000}
                  required={field.required}
                  disabled={busy || !writable}
                />
              ) : field.type === "checkbox" ? (
                <input
                  id={`org-${field.key}`}
                  name={field.key}
                  type="checkbox"
                  defaultChecked={Boolean(editing?.[field.key])}
                  disabled={busy || !writable}
                  className="size-5 accent-primary"
                />
              ) : field.type === "parent" ? (
                <div className="sm:col-span-2">
                  <SearchSelect
                    id={`org-${field.key}`}
                    name={field.key}
                    label={field.label}
                    value={parentSelection}
                    selectedLabel={parentLabel}
                    options={parents}
                    search={parentSearch}
                    onSearchChange={(value) => {
                      setParentSearch(value);
                      setParentPage(1);
                    }}
                    onValueChange={(value, label) => {
                      setParentSelection(value);
                      setParentLabel(label);
                    }}
                    disabled={busy || !writable}
                    loading={parentLoading}
                    error={parentError}
                    required={field.required}
                    page={parentPage}
                    pages={parentPages}
                    onPageChange={setParentPage}
                  />
                </div>
              ) : field.type === "status" ? (
                <select
                  id={`org-${field.key}`}
                  name={field.key}
                  defaultValue={String(editing?.[field.key] ?? "ACTIVE")}
                  required={field.required}
                  disabled={busy || !writable}
                  className="min-h-11 w-full rounded-md border border-input bg-background px-3 sm:col-span-2"
                >
                  <option value="ACTIVE">Aktif</option>
                  <option value="INACTIVE">Tidak aktif</option>
                </select>
              ) : (
                <Input
                  className="min-h-11 sm:col-span-2"
                  id={`org-${field.key}`}
                  name={field.key}
                  type={field.type === "email" ? "email" : "text"}
                  defaultValue={String(editing?.[field.key] ?? "")}
                  maxLength={
                    field.key === "name" || field.key === "code" ? 100 : 1000
                  }
                  required={field.required}
                  disabled={busy || !writable}
                />
              )}
            </div>
          ))}
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2 sm:col-start-2">
          {!direct && (
            <Button
              className="min-h-11"
              type="button"
              variant="outline"
              disabled={busy || !writable}
              onClick={() => setEditing(undefined)}
            >
              Kembali
            </Button>
          )}
          <Button
            className="min-h-11"
            type="submit"
            disabled={busy || parentLoading || !!parentError || !writable}
          >
            {busy ? "Menyimpan…" : editing ? "Update" : "Simpan"}
          </Button>
        </div>
      </form>
    </section>
  );
  if (editing !== undefined && !direct) return editor;
  if (direct && !loading)
    return (
      <div className="space-y-5">
        {(total > 1 || !editing?.id) && (
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="company-record">Perusahaan</Label>
              <select
                id="company-record"
                className="min-h-11 w-full rounded-md border border-input bg-background px-3"
                value={editing?.id ?? ""}
                onChange={(event) =>
                  setEditing(
                    items.find(
                      (item) => item.id === Number(event.target.value),
                    ) ?? null,
                  )
                }
              >
                <option value="">Perusahaan baru</option>
                {editing?.id &&
                  !items.some((item) => item.id === editing.id) && (
                    <option value={editing.id}>{editing.name}</option>
                  )}
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            {writable && (
              <Button
                className="min-h-11"
                variant="default"
                onClick={() => setEditing(null)}
              >
                <Plus aria-hidden="true" />
                Tambah Perusahaan
              </Button>
            )}
            <Button
              className="min-h-11"
              variant="outline"
              disabled={page <= 1}
              onClick={() => {
                setEditing(undefined);
                setPage(page - 1);
              }}
            >
              Sebelumnya
            </Button>
            <Button
              className="min-h-11"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => {
                setEditing(undefined);
                setPage(page + 1);
              }}
            >
              Berikutnya
            </Button>
          </div>
        )}
        {notice && <output>{notice}</output>}
        {editor}
        {writable && total === 1 && editing?.id && (
          <Button
            className="min-h-11"
            variant="default"
            onClick={() => setEditing(null)}
          >
            <Plus aria-hidden="true" />
            Tambah Perusahaan
          </Button>
        )}
        {writable && editing?.id && (
          <Button
            className="min-h-11"
            variant="destructive"
            onClick={(event) => {
              dialogTrigger.current = event.currentTarget;
              setRemoving(editing);
            }}
          >
            <Trash2 aria-hidden="true" />
            Hapus perusahaan
          </Button>
        )}
        {deleteDialog}
      </div>
    );
  return (
    <section className="space-y-4" aria-label={config.label}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 ref={listHeading} tabIndex={-1} className="text-lg font-semibold">
          {config.label}
        </h2>
        {writable && (
          <Button
            className="min-h-11"
            onClick={(event) => {
              dialogTrigger.current = event.currentTarget;
              setError("");
              setParents([]);
              setParentPage(1);
              setParentSearch("");
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
          <Label htmlFor={`search-${kind}`}>Cari nama</Label>
          <Input
            className="min-h-11"
            id={`search-${kind}`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            maxLength={100}
          />
        </div>
        {kind !== "company" && (
          <div className="space-y-2">
            <Label htmlFor={`status-${kind}`}>Status</Label>
            <select
              id={`status-${kind}`}
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
        <Button className="min-h-11" type="submit">
          Cari
        </Button>
      </form>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {notice && <output className="text-sm">{notice}</output>}
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
                <TableHead scope="col">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
                  {fields.map((field) => (
                    <TableCell key={field.key}>
                      {field.type === "status"
                        ? row[field.key] === "ACTIVE"
                          ? "Aktif"
                          : "Tidak aktif"
                        : typeof row[field.key] === "boolean"
                          ? row[field.key]
                            ? "Ya"
                            : "Tidak"
                          : String(
                              row[`${field.key}Label`] ?? row[field.key] ?? "—",
                            )}
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex gap-2">
                      {writable ? (
                        <>
                          <Button
                            variant="default"
                            className="min-h-11"
                            onClick={(event) => {
                              dialogTrigger.current = event.currentTarget;
                              setError("");
                              setEditing(row);
                            }}
                          >
                            <Pencil aria-hidden="true" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            className="min-h-11"
                            onClick={(event) => {
                              dialogTrigger.current = event.currentTarget;
                              setError("");
                              setRemoving(row);
                            }}
                          >
                            <Trash2 aria-hidden="true" />
                            Hapus
                          </Button>
                        </>
                      ) : (
                        "Hanya baca"
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!items.length && (
                <TableRow>
                  <TableCell colSpan={fields.length + 2}>
                    Tidak ada data yang sesuai.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              {total} data · Halaman {page} dari {totalPages}
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
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        </>
      )}
      {deleteDialog}
    </section>
  );
}
