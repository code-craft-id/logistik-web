"use client";

import { ChevronLeft, ChevronRight, Edit, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { EmptyState, LoadingState } from "@/components/patterns/content-state";
import { FormField } from "@/components/patterns/form-field";
import { PageHeading } from "@/components/patterns/page-heading";
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

interface UserGroup {
  id: number;
  name: string;
  description: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  _count: { users: number; permissions: number };
}

type Status = "ACTIVE" | "INACTIVE";

export function UserGroupPageClient({
  capabilities = {},
}: {
  capabilities?: IdentityCapabilities;
}) {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "">("");
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
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "ACTIVE" as Status,
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchGroups = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: "20",
          ...(search && { search }),
          ...(statusFilter && { status: statusFilter }),
        });
        const res = await fetch(`/group-user/api?${params}`, { signal });
        if (!res.ok)
          throw new Error((await res.json()).message || "Gagal memuat data");
        const data = await res.json();
        setGroups(data.items);
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
    [page, search, statusFilter],
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchGroups(controller.signal);
    return () => controller.abort();
  }, [fetchGroups]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const url = editingGroup
        ? `/group-user/api/${editingGroup.id}`
        : "/group-user/api";
      const method = editingGroup ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Gagal menyimpan");
      }

      setDialogOpen(false);
      setEditingGroup(null);
      setFormData({ name: "", description: "", status: "ACTIVE" });
      fetchGroups();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus grup ini?")) return;

    try {
      const res = await fetch(`/group-user/api/${id}`, { method: "DELETE" });
      if (!res.ok)
        throw new Error((await res.json()).message || "Gagal menghapus");
      fetchGroups();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  };

  const openCreateDialog = (event: React.MouseEvent<HTMLButtonElement>) => {
    dialogTrigger.current = event.currentTarget;
    setEditingGroup(null);
    setFormData({ name: "", description: "", status: "ACTIVE" });
    setFormError("");
    setDialogOpen(true);
  };

  const openEditDialog = (group: UserGroup, trigger: HTMLButtonElement) => {
    dialogTrigger.current = trigger;
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || "",
      status: group.status,
    });
    setFormError("");
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeading
        title="Grup User"
        description="Grup menentukan peran user. Izin tiap grup diatur di Hak Akses Menu."
        action={
          capabilities.create ? (
            <Button className="min-h-11" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Grup
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-4">
        <div className="min-w-0 flex-1 basis-64">
          <Input
            ref={searchInput}
            placeholder="Cari grup..."
            value={search}
            aria-label="Cari grup"
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
            aria-label="Filter status grup"
            className="w-full sm:w-48"
          >
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="ACTIVE">Aktif</SelectItem>
            <SelectItem value="INACTIVE">Nonaktif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <EmptyState
          title="Error"
          description={error}
          action={<Button onClick={() => void fetchGroups()}>Coba Lagi</Button>}
        />
      ) : groups.length === 0 ? (
        <EmptyState
          title="Belum ada grup user"
          description="Klik tombol 'Tambah Grup' untuk membuat grup baru"
        />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">No</TableHead>
                  <TableHead>Nama Grup</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="w-36">Status</TableHead>
                  <TableHead className="w-32">User</TableHead>
                  <TableHead className="w-36">Hak Akses</TableHead>
                  <TableHead className="w-40">Dibuat</TableHead>
                  <TableHead className="w-48">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((group, index) => (
                  <TableRow key={group.id}>
                    <TableCell>{(page - 1) * 20 + index + 1}</TableCell>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {group.description || "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          group.status === "ACTIVE"
                            ? "bg-accent text-accent-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {group.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
                      </span>
                    </TableCell>
                    <TableCell>{group._count.users}</TableCell>
                    <TableCell>{group._count.permissions}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(group.createdAt).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="default"
                          size="icon"
                          className="min-h-11 min-w-11"
                          disabled={!capabilities.update}
                          onClick={(event) =>
                            openEditDialog(group, event.currentTarget)
                          }
                          aria-label="Edit grup"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          disabled={!capabilities.delete}
                          onClick={() => handleDelete(group.id)}
                          aria-label="Hapus grup"
                          className="min-h-11 min-w-11"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button asChild variant="link" className="min-h-11">
                          <Link href={`/hak-akses-menu?groupId=${group.id}`}>
                            Atur hak akses
                          </Link>
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
                Menampilkan {groups.length} dari {total} grup
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Halaman grup sebelumnya"
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Halaman grup berikutnya"
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onCloseAutoFocus={restoreFocus} className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? "Edit Grup User" : "Tambah Grup User"}
            </DialogTitle>
            <DialogDescription>
              {editingGroup
                ? "Perbarui informasi grup user"
                : "Buat grup user baru dengan nama dan deskripsi"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {formError && (
                <div className="text-sm text-destructive" role="alert">
                  {formError}
                </div>
              )}
              <FormField id="name" label="Nama Grup" error={formError}>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Contoh: Administrator, Operasional, Viewer"
                  required
                  disabled={submitting}
                />
              </FormField>
              <FormField id="description" label="Deskripsi">
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Deskripsi singkat tentang grup ini"
                />
              </FormField>
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
                disabled={submitting || !formData.name.trim()}
              >
                {submitting
                  ? "Menyimpan..."
                  : editingGroup
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
