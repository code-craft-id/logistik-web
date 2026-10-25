"use client";

import { AlertCircle, Save } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { EmptyState, LoadingState } from "@/components/patterns/content-state";
import { PageHeading } from "@/components/patterns/page-heading";
import { SearchSelect } from "@/components/patterns/search-select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type IdentityCapabilities,
  permissionRestriction,
} from "@/features/identity/permissions";

interface GroupPermission {
  group: { id: number; name: string; userCount: number };
  permissions: Record<string, Record<string, boolean>>;
}

interface ResourceConfig {
  resource: string;
  label: string;
  actions: string[];
}

const actionLabels: Record<string, string> = {
  view: "Lihat",
  create: "Tambah",
  update: "Ubah",
  delete: "Hapus",
  manage: "Akses penuh",
};
function fullAccess(group: GroupPermission) {
  return !!group.permissions.system_admin?.manage;
}
export function PermissionMatrixPageClient({
  capabilities = {},
}: {
  capabilities?: IdentityCapabilities;
}) {
  const params = useSearchParams();
  const requestedGroupId = Number(params.get("groupId")) || null;
  const [matrix, setMatrix] = useState<GroupPermission[]>([]);
  const [resources, setResources] = useState<ResourceConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [groupSearch, setGroupSearch] = useState("");
  const [groupPage, setGroupPage] = useState(1);
  const [focusRequested, setFocusRequested] = useState(true);

  const fetchMatrix = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams({
          page: String(groupPage),
          pageSize: "20",
          search: groupSearch,
        });
        if (focusRequested && requestedGroupId)
          query.set("groupId", String(requestedGroupId));
        const res = await fetch(`/hak-akses-menu/api?${query}`, { signal });
        if (!res.ok)
          throw new Error((await res.json()).message || "Gagal memuat data");
        const data = await res.json();
        setMatrix(data.groups);
        setResources(data.resources);
        setSelectedGroupId((previous) =>
          data.groups.some(
            (entry: GroupPermission) => entry.group.id === previous,
          )
            ? previous
            : (data.groups[0]?.group.id ?? null),
        );
      } catch (err) {
        if (!signal?.aborted)
          setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [requestedGroupId, groupPage, groupSearch, focusRequested],
  );
  useEffect(() => {
    const controller = new AbortController();
    void fetchMatrix(controller.signal);
    return () => controller.abort();
  }, [fetchMatrix]);
  useEffect(() => {
    if (requestedGroupId) setSelectedGroupId(requestedGroupId);
  }, [requestedGroupId]);

  const handleSave = async () => {
    if (!selectedGroupId || !capabilities.update) return;
    setSaving(true);
    setSaveError("");

    try {
      const group = matrix.find((g) => g.group.id === selectedGroupId);
      if (!group) throw new Error("Grup tidak ditemukan");

      const permissions: Array<{
        resource: string;
        action: string;
        granted: boolean;
      }> = [];
      for (const resource of resources) {
        for (const action of resource.actions) {
          permissions.push({
            resource: resource.resource,
            action,
            granted: group.permissions[resource.resource]?.[action] || false,
          });
        }
      }

      const res = await fetch("/hak-akses-menu/api", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: selectedGroupId, permissions }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Gagal menyimpan");
      }

      fetchMatrix();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (
    groupId: number,
    resource: string,
    action: string,
  ) => {
    setMatrix((prev) =>
      prev.map((g) =>
        g.group.id === groupId
          ? {
              ...g,
              permissions: {
                ...g.permissions,
                [resource]: {
                  ...g.permissions[resource],
                  [action]: !g.permissions[resource]?.[action],
                },
              },
            }
          : g,
      ),
    );
  };

  const filteredResources = resources.filter(
    (r) =>
      r.label.toLowerCase().includes(search.toLowerCase()) ||
      r.actions.some((a) => a.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="space-y-6 rounded-md border bg-background p-4 sm:p-6">
      <PageHeading
        title="Hak Akses Menu"
        description="User mengikuti peran grupnya. Izin diperiksa di server dan perubahan berlaku pada seluruh anggota grup. Pengaturan modul Dev 1 tidak mengaktifkan alur yang belum diimplementasikan."
        action={
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={
                saving || loading || !selectedGroupId || !capabilities.update
              }
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        }
      />

      {selectedGroupId && saveError && (
        <div
          className="flex items-center gap-2 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="h-4 w-4" />
          {saveError}
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <div className="min-w-0 flex-1 basis-64">
          <Input
            aria-label="Cari hak akses"
            placeholder="Cari menu atau aksi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <div className="w-full sm:w-72">
          <SearchSelect
            id="permission-group"
            label="Pilih grup hak akses"
            value={selectedGroupId ? String(selectedGroupId) : ""}
            options={matrix.map((entry) => ({
              id: entry.group.id,
              name: `${entry.group.name} (${entry.group.userCount} user)`,
            }))}
            search={groupSearch}
            onSearchChange={(value) => {
              setGroupSearch(value);
              setGroupPage(1);
              setFocusRequested(false);
            }}
            page={groupPage}
            pages={matrix.length === 20 ? groupPage + 1 : groupPage}
            onPageChange={setGroupPage}
            loading={loading}
            error={error ?? undefined}
            disabled={saving}
            onValueChange={(value) => {
              setSaveError("");
              setSelectedGroupId(value ? Number(value) : null);
            }}
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Izin Administrator memberikan akses penuh lintas cabang. Lepaskan izin
        tersebut sebelum membatasi aksi satu per satu; administrator aktif
        terakhir tetap dilindungi.
      </p>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <EmptyState
          title="Error"
          description={error}
          action={<Button onClick={() => void fetchMatrix()}>Coba Lagi</Button>}
        />
      ) : matrix.length === 0 ? (
        <EmptyState
          title="Belum ada grup user"
          description="Buat grup user terlebih dahulu di halaman 'Grup User'"
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Menu</TableHead>
                <TableHead>Grup User</TableHead>
                {["view", "create", "update", "delete", "manage"].map(
                  (action) => (
                    <TableHead key={action} className="text-center">
                      {actionLabels[action]}
                    </TableHead>
                  ),
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResources.map((resource, index) => {
                const group = matrix.find(
                  (g) => g.group.id === selectedGroupId,
                );
                return (
                  <TableRow key={resource.resource}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="min-w-56 font-medium">
                      {resource.label}
                      {permissionRestriction(resource.resource) && (
                        <p className="mt-1 max-w-sm text-xs font-normal text-muted-foreground">
                          {permissionRestriction(resource.resource)}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>{group?.group.name ?? "Pilih grup"}</TableCell>
                    {["view", "create", "update", "delete", "manage"].map(
                      (action) => (
                        <TableCell key={action} className="text-center">
                          {group && resource.actions.includes(action) ? (
                            <span className="inline-flex min-h-11 min-w-11 items-center justify-center">
                              <Checkbox
                                checked={
                                  (resource.resource !== "system_admin" &&
                                    fullAccess(group)) ||
                                  group.permissions[resource.resource]?.[
                                    action
                                  ] ||
                                  false
                                }
                                disabled={
                                  !capabilities.update ||
                                  saving ||
                                  (resource.resource === "system_admin"
                                    ? !capabilities.administrator
                                    : fullAccess(group))
                                }
                                onCheckedChange={() =>
                                  togglePermission(
                                    group.group.id,
                                    resource.resource,
                                    action,
                                  )
                                }
                                aria-label={`${actionLabels[action] || action} ${resource.label} — ${group.group.name}`}
                              />
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      ),
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
