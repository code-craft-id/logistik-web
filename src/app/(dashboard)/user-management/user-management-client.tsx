"use client";

import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Key,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { EmptyState, LoadingState } from "@/components/patterns/content-state";
import { FormField } from "@/components/patterns/form-field";
import { PageHeading } from "@/components/patterns/page-heading";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { IdentityCapabilities } from "@/features/identity/permissions";
import { cn } from "@/lib/utils";

interface User {
  id: number;
  name: string;
  username: string | null;
  fullAccess: boolean;
  email: string;
  group: { id: number; name: string } | null;
  allowedBranches: Array<{
    branch: { id: number; name: string; code: string };
  }>;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  canAccess: boolean;
}

interface Group {
  id: number;
  name: string;
}

interface Branch {
  id: number;
  name: string;
  code: string;
  office: { name: string };
}

type Status = "ACTIVE" | "INACTIVE";

function useAssignmentOptions<T>(kind: "groups" | "branches") {
  const [items, setItems] = useState<T[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const load = async () => {
      try {
        const params = new URLSearchParams({
          search,
          page: String(page),
          pageSize: "50",
        });
        const response = await fetch(`/user-management/api/${kind}?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Gagal memuat pilihan. Coba lagi.");
        const data: T[] = await response.json();
        if (!controller.signal.aborted) {
          setItems(data);
          setError("");
        }
      } catch (error) {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error ? error.message : "Gagal memuat pilihan.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    const timer =
      kind === "branches" && search
        ? setTimeout(() => void load(), 300)
        : undefined;
    if (!timer) void load();
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [kind, search, page]);
  return {
    items,
    search,
    page,
    loading,
    error,
    pages: items.length === 50 ? page + 1 : page,
    setPage,
    setSearch: (value: string) => {
      setSearch(value);
      setPage(1);
    },
  };
}

export function UserManagementPageClient({
  capabilities = {},
}: {
  capabilities?: IdentityCapabilities;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const groupOptions = useAssignmentOptions<Group>("groups");
  const filterGroups = useAssignmentOptions<Group>("groups");
  const branchOptions = useAssignmentOptions<Branch>("branches");
  const [selectedGroupLabel, setSelectedGroupLabel] = useState("");
  const [filterGroupLabel, setFilterGroupLabel] = useState("");
  const [branchLabels, setBranchLabels] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "">("");
  const [groupFilter, setGroupFilter] = useState<number | "">("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const dialogTrigger = useRef<HTMLButtonElement | null>(null);
  const searchInput = useRef<HTMLInputElement | null>(null);
  const restoreFocus = (event: Event) => {
    event.preventDefault();
    (dialogTrigger.current?.isConnected
      ? dialogTrigger.current
      : searchInput.current
    )?.focus();
  };
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    groupId: "",
    branchIds: [] as number[],
    status: "ACTIVE" as Status,
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fetchUsers = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: "20",
          ...(search && { search }),
          ...(statusFilter && { status: statusFilter }),
          ...(groupFilter && { groupId: groupFilter.toString() }),
        });
        const res = await fetch(`/user-management/api?${params}`, { signal });
        if (!res.ok)
          throw new Error((await res.json()).message || "Gagal memuat data");
        const data = await res.json();
        setUsers(data.items);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
        if (page > data.pagination.totalPages)
          setPage(data.pagination.totalPages);
      } catch (err) {
        if (!signal?.aborted)
          setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [page, search, statusFilter, groupFilter],
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchUsers(controller.signal);
    return () => controller.abort();
  }, [fetchUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const url = editingUser
        ? `/user-management/api/${editingUser.id}`
        : "/user-management/api";
      const method = editingUser ? "PATCH" : "POST";
      const body = {
        ...formData,
        groupId: formData.groupId ? Number(formData.groupId) : undefined,
        password:
          editingUser && !formData.password ? undefined : formData.password,
        branchIds: formData.branchIds,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Gagal menyimpan");
      }

      setDialogOpen(false);
      setEditingUser(null);
      setFormData({
        name: "",
        username: "",
        email: "",
        password: "",
        groupId: "",
        branchIds: [],
        status: "ACTIVE",
      });
      fetchUsers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (
      !confirm(
        "Nonaktifkan user ini? Login akan ditolak dan sesi aktif dicabut. Identitas tetap disimpan.",
      )
    )
      return;

    try {
      const res = await fetch(`/user-management/api/${id}`, {
        method: "DELETE",
      });
      if (!res.ok)
        throw new Error((await res.json()).message || "Gagal menonaktifkan");
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  };

  const openCreateDialog = (event: React.MouseEvent<HTMLButtonElement>) => {
    dialogTrigger.current = event.currentTarget;
    setSelectedGroupLabel("");
    setBranchLabels({});
    setEditingUser(null);
    setFormData({
      name: "",
      username: "",
      email: "",
      password: "",
      groupId: "",
      branchIds: [],
      status: "ACTIVE",
    });
    setFormError("");
    setDialogOpen(true);
  };

  const openEditDialog = (user: User, trigger: HTMLButtonElement) => {
    dialogTrigger.current = trigger;
    setBranchLabels(
      Object.fromEntries(
        user.allowedBranches.map(({ branch }) => [
          branch.id,
          `${branch.code} — ${branch.name}`,
        ]),
      ),
    );
    setEditingUser(user);
    setFormData({
      name: user.name,
      username: user.username || "",
      email: user.email,
      password: "",
      groupId: user.group?.id.toString() || "",
      branchIds: user.allowedBranches.map((ab) => ab.branch.id),
      status: user.status,
    });
    setSelectedGroupLabel(user.group?.name ?? "");
    setFormError("");
    setDialogOpen(true);
  };

  const renderTable = () => (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">No</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-36">Grup</TableHead>
              <TableHead className="w-48">Cabang</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="w-40">Dibuat</TableHead>
              <TableHead className="w-56">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user, index) => (
              <TableRow key={user.id}>
                <TableCell>{(page - 1) * 20 + index + 1}</TableCell>
                <TableCell className="font-medium">
                  {user.username || "—"}
                </TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.group ? (
                    <span className="inline-flex items-center rounded-full bg-secondary text-secondary-foreground px-2.5 py-0.5 text-xs font-medium">
                      {user.group.name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {user.allowedBranches.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {user.allowedBranches.slice(0, 3).map((ab) => (
                        <span
                          key={ab.branch.id}
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs",
                            user.canAccess
                              ? "bg-accent text-accent-foreground"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {ab.branch.code}
                        </span>
                      ))}
                      {user.allowedBranches.length > 3 && (
                        <span className="inline-flex items-center rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-xs">
                          +{user.allowedBranches.length - 3}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      {user.fullAccess
                        ? "Semua cabang (Administrator)"
                        : "Belum ditugaskan"}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      user.status === "ACTIVE"
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {user.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString("id-ID")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="default"
                      size="icon"
                      className="min-h-11 min-w-11"
                      disabled={!capabilities.update}
                      onClick={(event) =>
                        openEditDialog(user, event.currentTarget)
                      }
                      aria-label="Edit user"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      disabled={!capabilities.delete}
                      onClick={() => handleDelete(user.id)}
                      aria-label="Nonaktifkan user"
                      className="min-h-11 min-w-11"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Menampilkan {users.length} dari {total} user
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Halaman user sebelumnya"
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Halaman user berikutnya"
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      <PageHeading
        title="Manajemen User"
        description="Kelola pengguna sistem, grup, dan akses cabang"
        action={
          capabilities.create ? (
            <Button className="min-h-11" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah User
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-4">
        <div className="min-w-0 flex-1 basis-64">
          <Input
            placeholder="Cari username, nama, atau email..."
            ref={searchInput}
            aria-label="Cari user"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="max-w-xs"
          />
        </div>
        <Select
          value={statusFilter || "all"}
          onValueChange={(v) => {
            setStatusFilter(v === "all" ? "" : (v as Status));
            setPage(1);
          }}
        >
          <SelectTrigger
            aria-label="Filter status user"
            className="w-full sm:w-40"
          >
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="ACTIVE">Aktif</SelectItem>
            <SelectItem value="INACTIVE">Nonaktif</SelectItem>
          </SelectContent>
        </Select>
        <div className="w-full sm:w-64">
          <SearchSelect
            id="user-group-filter"
            label="Filter grup user"
            value={String(groupFilter)}
            selectedLabel={filterGroupLabel}
            options={filterGroups.items}
            search={filterGroups.search}
            onSearchChange={filterGroups.setSearch}
            page={filterGroups.page}
            pages={filterGroups.pages}
            onPageChange={filterGroups.setPage}
            loading={filterGroups.loading}
            error={filterGroups.error}
            onValueChange={(value, label) => {
              setGroupFilter(value ? Number(value) : "");
              setFilterGroupLabel(label);
              setPage(1);
            }}
          />
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <EmptyState
          title="Error"
          description={error}
          action={<Button onClick={() => void fetchUsers()}>Coba Lagi</Button>}
        />
      ) : users.length === 0 ? (
        <EmptyState
          title="Belum ada user"
          description="Klik tombol 'Tambah User' untuk membuat user baru"
        />
      ) : (
        renderTable()
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onCloseAutoFocus={restoreFocus} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Edit User" : "Tambah User"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Perbarui informasi user. Kosongkan password jika tidak ingin mengubah."
                : "Buat user dengan username, password, dan grup yang menentukan perannya."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {formError && (
                <div className="text-sm text-destructive" role="alert">
                  {formError}
                </div>
              )}
              <FormField id="name" label="Nama Lengkap" error={formError}>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Nama lengkap user"
                  required
                  disabled={submitting}
                />
              </FormField>
              <FormField id="username" label="Username">
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  minLength={3}
                  maxLength={30}
                  pattern="[a-zA-Z0-9_.]+"
                  autoComplete="off"
                  required
                  disabled={submitting}
                />
              </FormField>
              <FormField id="email" label="Email">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="nama@perusahaan.com"
                  required
                  disabled={submitting || !!editingUser}
                />
              </FormField>
              <FormField
                id="password"
                label={
                  editingUser
                    ? "Password Baru (kosongkan jika tidak diubah)"
                    : "Password"
                }
              >
                <div className="relative">
                  <Input
                    id="password"
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder={
                      editingUser ? "••••••••" : "Minimal 8 karakter"
                    }
                    required={!editingUser}
                    disabled={submitting}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword
                        ? "Sembunyikan password"
                        : "Tampilkan password"
                    }
                  >
                    <Key className="h-4 w-4" />
                  </Button>
                </div>
              </FormField>
              <FormField
                id="groupId"
                label="Grup User"
                hint="Hak akses user mengikuti izin grup ini. Grup dapat diganti kapan saja oleh pengelola yang berwenang."
              >
                <SearchSelect
                  id="groupId"
                  label="Grup User"
                  value={formData.groupId}
                  selectedLabel={selectedGroupLabel || editingUser?.group?.name}
                  options={groupOptions.items}
                  search={groupOptions.search}
                  onSearchChange={groupOptions.setSearch}
                  page={groupOptions.page}
                  pages={groupOptions.pages}
                  onPageChange={groupOptions.setPage}
                  loading={groupOptions.loading}
                  error={groupOptions.error}
                  onValueChange={(value, label) => {
                    setSelectedGroupLabel(label);
                    setFormData((previous) => ({
                      ...previous,
                      groupId: value,
                    }));
                  }}
                  disabled={submitting}
                  required
                />
              </FormField>
              <fieldset className="min-w-0 space-y-3 rounded-md border p-3">
                <legend className="px-1 text-sm font-medium">
                  Cabang yang diizinkan
                </legend>
                <p className="text-sm text-muted-foreground">
                  Bisa memilih lebih dari satu. Kosong berarti tidak mendapat
                  akses data cabang; hanya grup dengan izin Administrator yang
                  memiliki akses penuh.
                </p>
                <Input
                  aria-label="Cari cabang penugasan"
                  placeholder="Cari kode atau nama cabang..."
                  value={branchOptions.search}
                  onChange={(event) =>
                    branchOptions.setSearch(event.target.value)
                  }
                  disabled={submitting}
                />
                <p className="text-sm text-muted-foreground">
                  {formData.branchIds.length} cabang dipilih. Pilihan tetap
                  tersimpan saat berpindah halaman.
                </p>
                <fieldset className="flex min-w-0 flex-wrap gap-2">
                  <legend className="sr-only">Cabang terpilih</legend>
                  {formData.branchIds.map((id) => (
                    <Button
                      key={id}
                      type="button"
                      variant="secondary"
                      className="h-auto min-h-11 max-w-full whitespace-normal text-left"
                      disabled={submitting}
                      aria-label={`Lepas akses cabang ${branchLabels[id] ?? id}`}
                      onClick={() =>
                        setFormData((previous) => ({
                          ...previous,
                          branchIds: previous.branchIds.filter(
                            (branchId) => branchId !== id,
                          ),
                        }))
                      }
                    >
                      <span className="min-w-0 break-words">
                        {branchLabels[id] ?? `ID ${id}`}
                      </span>
                      <X aria-hidden="true" className="size-4 shrink-0" />
                    </Button>
                  ))}
                </fieldset>
                {branchOptions.loading && <output>Memuat cabang...</output>}
                {branchOptions.error && (
                  <p role="alert" className="text-sm text-destructive">
                    {branchOptions.error}
                  </p>
                )}
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {branchOptions.items.map((branch) => (
                    <label
                      key={branch.id}
                      className="flex min-h-11 min-w-0 items-center gap-3 text-sm"
                    >
                      <input
                        type="checkbox"
                        className="shrink-0"
                        checked={formData.branchIds.includes(branch.id)}
                        disabled={
                          submitting ||
                          branchOptions.loading ||
                          !!branchOptions.error
                        }
                        onChange={(event) => {
                          if (event.target.checked)
                            setBranchLabels((previous) => ({
                              ...previous,
                              [branch.id]: `${branch.code} — ${branch.name}`,
                            }));
                          setFormData((previous) => ({
                            ...previous,
                            branchIds: event.target.checked
                              ? [...previous.branchIds, branch.id]
                              : previous.branchIds.filter(
                                  (id) => id !== branch.id,
                                ),
                          }));
                        }}
                      />
                      <span className="min-w-0 break-words">
                        {branch.code} — {branch.name} ({branch.office.name})
                      </span>
                    </label>
                  ))}
                  {!branchOptions.loading && !branchOptions.items.length && (
                    <p className="text-sm text-muted-foreground">
                      Tidak ada cabang yang dapat ditugaskan.
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      submitting ||
                      branchOptions.loading ||
                      branchOptions.page <= 1
                    }
                    onClick={() =>
                      branchOptions.setPage(branchOptions.page - 1)
                    }
                  >
                    Sebelumnya
                  </Button>
                  <span className="text-sm">Halaman {branchOptions.page}</span>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      submitting ||
                      branchOptions.loading ||
                      !!branchOptions.error ||
                      branchOptions.items.length < 50
                    }
                    onClick={() =>
                      branchOptions.setPage(branchOptions.page + 1)
                    }
                  >
                    Berikutnya
                  </Button>
                </div>
              </fieldset>
              <FormField id="status" label="Status">
                <Select
                  value={formData.status}
                  onValueChange={(v) =>
                    setFormData({ ...formData, status: v as Status })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Aktif</SelectItem>
                    <SelectItem value="INACTIVE">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={
                  submitting ||
                  !formData.name.trim() ||
                  !formData.email.trim() ||
                  !formData.username.trim() ||
                  !formData.groupId ||
                  (!editingUser && !formData.password)
                }
              >
                {submitting
                  ? "Menyimpan..."
                  : editingUser
                    ? "Perbarui"
                    : "Buat"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
