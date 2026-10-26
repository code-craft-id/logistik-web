"use client";

import { Building2, Key, Lock, LogOut, User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { EmptyState, LoadingState } from "@/components/patterns/content-state";
import { FormField } from "@/components/patterns/form-field";
import { PageHeading } from "@/components/patterns/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Profile {
  id: number;
  name: string;
  username: string | null;
  email: string;
  image: string | null;
  fullAccess: boolean;
  group: { id: number; name: string } | null;
  allowedBranches: Array<{ id: number; name: string; code: string }>;
  createdAt: string;
}

interface Session {
  id: number;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

type RevokeTarget =
  | { kind: "one"; session: Session }
  | { kind: "others" | "all" };
const emptyForm = {
  name: "",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

async function profileRequest(url: string, options?: RequestInit) {
  const response = await fetch(url, { ...options, cache: "no-store" });
  if (response.status === 401) {
    window.location.replace("/login");
    throw new Error("Sesi berakhir. Silakan masuk kembali.");
  }
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.message || "Permintaan tidak dapat diproses.");
  return data;
}

export function ProfilePageClient() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [notice, setNotice] = useState("");
  const [revokeTarget, setRevokeTarget] = useState<RevokeTarget | null>(null);
  const [revokePending, setRevokePending] = useState(false);
  const [revokeError, setRevokeError] = useState("");
  const revokeLock = useRef(false);
  const formLock = useRef(false);
  const editTrigger = useRef<HTMLButtonElement | null>(null);
  const revokeTrigger = useRef<HTMLButtonElement | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"name" | "password">("name");
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProfile(await profileRequest("/profile/api"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    setSessionLoading(true);
    setSessionError("");
    try {
      const data = await profileRequest(`/profile/api/sessions?page=${page}`);
      setSessions(data.items);
      setPagination(data.pagination);
      if (page > data.pagination.totalPages)
        setPage(data.pagination.totalPages);
    } catch (err) {
      setSessionError(
        err instanceof Error ? err.message : "Gagal memuat sesi.",
      );
    } finally {
      setSessionLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formLock.current) return;
    formLock.current = true;
    setFormError("");
    setSubmitting(true);

    try {
      if (
        dialogType === "password" &&
        formData.newPassword !== formData.confirmPassword
      )
        throw new Error("Konfirmasi password tidak sama.");
      if (dialogType === "name") {
        await profileRequest("/profile/api", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: formData.name }),
        });
      } else {
        await profileRequest("/profile/api/password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword,
            confirmPassword: formData.confirmPassword,
          }),
        });
      }

      setDialogOpen(false);
      setFormData(emptyForm);
      if (dialogType === "password") {
        window.location.replace("/login");
      } else {
        setNotice("Nama profil berhasil diperbarui.");
        await fetchProfile();
        router.refresh();
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
      formLock.current = false;
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget || revokeLock.current) return;
    revokeLock.current = true;
    setRevokePending(true);
    setRevokeError("");
    try {
      const result =
        revokeTarget.kind === "one"
          ? await profileRequest(
              `/profile/api/sessions/${revokeTarget.session.id}`,
              { method: "DELETE" },
            )
          : await profileRequest("/profile/api/sessions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ scope: revokeTarget.kind }),
            });
      if (result.reauthenticate) {
        window.location.replace("/login");
        return;
      }
      setRevokeTarget(null);
      setNotice("Sesi berhasil dicabut.");
      await fetchSessions();
    } catch (err) {
      setRevokeError(
        err instanceof Error ? err.message : "Gagal mencabut sesi.",
      );
    } finally {
      setRevokePending(false);
      revokeLock.current = false;
    }
  };

  const openRevoke = (target: RevokeTarget, trigger: HTMLButtonElement) => {
    revokeTrigger.current = trigger;
    setRevokeError("");
    setRevokeTarget(target);
  };

  const openNameDialog = (event: React.MouseEvent<HTMLButtonElement>) => {
    editTrigger.current = event.currentTarget;
    setDialogType("name");
    setFormData({
      name: profile?.name || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setFormError("");
    setDialogOpen(true);
  };

  const openPasswordDialog = (event: React.MouseEvent<HTMLButtonElement>) => {
    editTrigger.current = event.currentTarget;
    setDialogType("password");
    setFormData({
      name: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setFormError("");
    setDialogOpen(true);
  };

  const parseUserAgent = (ua: string | null) => {
    if (!ua) return "Unknown";
    if (ua.includes("Mobile")) return "Mobile";
    if (ua.includes("Windows")) return "Windows";
    if (ua.includes("Mac")) return "Mac";
    if (ua.includes("Linux")) return "Linux";
    return "Other";
  };

  return (
    <div className="space-y-6">
      <PageHeading
        title="Profil Saya"
        description="Kelola informasi akun, keamanan, dan sesi aktif"
      />
      {notice && (
        <output className="block text-sm" aria-live="polite">
          {notice}
        </output>
      )}

      {loading ? (
        <LoadingState />
      ) : error ? (
        <EmptyState
          title="Error"
          description={error}
          action={<Button onClick={fetchProfile}>Coba Lagi</Button>}
        />
      ) : profile ? (
        <>
          <div className="grid min-w-0 gap-6 md:grid-cols-3">
            <div className="min-w-0 md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informasi Profil
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                      {profile.image ? (
                        <Image
                          width={80}
                          height={80}
                          unoptimized
                          src={profile.image}
                          alt={profile.name}
                          className="h-20 w-20 rounded-full"
                        />
                      ) : (
                        <User className="h-10 w-10 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0 break-words">
                      <h3 className="text-xl font-semibold">{profile.name}</h3>
                      <p className="text-muted-foreground">
                        @{profile.username ?? "—"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {profile.email}
                      </p>
                      {profile.group && (
                        <span className="inline-flex items-center rounded-full bg-secondary text-secondary-foreground px-2.5 py-0.5 text-xs font-medium mt-1">
                          {profile.group.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <Separator />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        ID User
                      </p>
                      <p className="font-mono text-sm">{profile.id}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Bergabung
                      </p>
                      <p className="text-sm">
                        {new Date(profile.createdAt).toLocaleDateString(
                          "id-ID",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={openNameDialog}>
                      <User className="mr-2 h-4 w-4" />
                      Ubah Nama
                    </Button>
                    <Button variant="outline" onClick={openPasswordDialog}>
                      <Lock className="mr-2 h-4 w-4" />
                      Ubah Password
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Akses Cabang
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profile.allowedBranches.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Kode</TableHead>
                          <TableHead>Nama Cabang</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {profile.allowedBranches.map((branch) => (
                          <TableRow key={branch.id}>
                            <TableCell className="font-medium">
                              {branch.code}
                            </TableCell>
                            <TableCell>{branch.name}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
                      <p className="mt-2 text-muted-foreground">
                        {profile.fullAccess
                          ? "Akses penuh (Administrator)"
                          : "Belum ada cabang yang ditugaskan."}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="min-w-0 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Keamanan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Kelola password dan sesi aktif untuk menjaga keamanan akun
                    Anda.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={openPasswordDialog}
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Ubah Password
                  </Button>
                  <Separator />
                  <Button
                    variant="outline"
                    className="h-auto min-h-11 w-full whitespace-normal text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(event) =>
                      openRevoke({ kind: "all" }, event.currentTarget)
                    }
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Keluar dari Semua Perangkat
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Bantuan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Jika mengalami masalah login, hubungi administrator sistem.
                  </p>
                  <p>Password harus minimal 8 karakter.</p>
                  <p>
                    Lihat waktu kedaluwarsa setiap sesi pada daftar di bawah.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Sesi Aktif ({pagination.total})
              </CardTitle>
              <Button
                variant="outline"
                onClick={(event) =>
                  openRevoke({ kind: "others" }, event.currentTarget)
                }
              >
                Cabut Sesi Lain
              </Button>
            </CardHeader>
            <CardContent>
              {sessionLoading ? (
                <LoadingState label="Memuat sesi..." />
              ) : sessionError ? (
                <div role="alert" className="space-y-3">
                  <p className="text-sm text-destructive">{sessionError}</p>
                  <Button variant="outline" onClick={fetchSessions}>
                    Coba Muat Sesi Lagi
                  </Button>
                </div>
              ) : sessions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Perangkat</TableHead>
                      <TableHead className="w-40">IP Address</TableHead>
                      <TableHead className="w-40">Dibuat</TableHead>
                      <TableHead className="w-40">Kedaluwarsa</TableHead>
                      <TableHead className="w-24">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          {parseUserAgent(session.userAgent)}
                          {session.isCurrent && (
                            <span className="block text-xs text-muted-foreground">
                              Sesi saat ini
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {session.ipAddress || "Unknown"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(session.createdAt).toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(session.expiresAt).toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(event) =>
                              openRevoke(
                                { kind: "one", session },
                                event.currentTarget,
                              )
                            }
                            aria-label={
                              session.isCurrent
                                ? "Cabut sesi saat ini"
                                : "Cabut sesi"
                            }
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <LogOut className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  title="Tidak ada sesi aktif"
                  description="Sesi akan muncul di sini setelah login"
                />
              )}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Halaman {page} dari {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={sessionLoading || page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    disabled={sessionLoading || page >= pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Berikutnya
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (formLock.current) return;
          setDialogOpen(open);
          if (!open) setFormData(emptyForm);
        }}
      >
        <DialogContent
          showCloseButton={!submitting}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            editTrigger.current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {dialogType === "name" ? "Ubah Nama" : "Ubah Password"}
            </DialogTitle>
            <DialogDescription>
              {dialogType === "name"
                ? "Perbarui nama tampilan Anda"
                : "Masukkan password lama dan password baru. Semua sesi akan dicabut dan Anda perlu masuk kembali."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {formError && (
                <div className="text-sm text-destructive" role="alert">
                  {formError}
                </div>
              )}
              {dialogType === "name" && (
                <FormField id="name" label="Nama Lengkap" error={formError}>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Nama lengkap"
                    required
                    maxLength={100}
                    aria-invalid={!!formError}
                    aria-describedby={formError ? "name-error" : undefined}
                    disabled={submitting}
                  />
                </FormField>
              )}
              {dialogType === "password" && (
                <>
                  <FormField id="currentPassword" label="Password Saat Ini">
                    <Input
                      id="currentPassword"
                      autoComplete="current-password"
                      maxLength={128}
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          currentPassword: e.target.value,
                        })
                      }
                      placeholder="••••••••"
                      required
                      disabled={submitting}
                    />
                  </FormField>
                  <FormField id="newPassword" label="Password Baru">
                    <Input
                      id="newPassword"
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={128}
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          newPassword: e.target.value,
                        })
                      }
                      placeholder="Minimal 8 karakter"
                      required
                      disabled={submitting}
                    />
                  </FormField>
                  <FormField
                    id="confirmPassword"
                    label="Konfirmasi Password Baru"
                  >
                    <Input
                      id="confirmPassword"
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={128}
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder="••••••••"
                      required
                      disabled={submitting}
                    />
                  </FormField>
                </>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setFormData(emptyForm);
                }}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={
                  submitting ||
                  (dialogType === "name"
                    ? !formData.name.trim()
                    : !formData.currentPassword ||
                      !formData.newPassword ||
                      formData.newPassword !== formData.confirmPassword)
                }
              >
                {submitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!revokeTarget}
        onOpenChange={(open) => {
          if (!open && !revokeLock.current) setRevokeTarget(null);
        }}
      >
        <DialogContent
          showCloseButton={!revokePending}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            revokeTrigger.current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>Konfirmasi Pencabutan Sesi</DialogTitle>
            <DialogDescription>
              {revokeTarget?.kind === "all" ||
              (revokeTarget?.kind === "one" && revokeTarget.session.isCurrent)
                ? "Sesi perangkat ini juga akan dicabut. Anda perlu masuk kembali."
                : revokeTarget?.kind === "others"
                  ? "Semua sesi lain akan dicabut. Sesi perangkat ini tetap aktif."
                  : "Perangkat pada sesi ini akan diminta masuk kembali."}
            </DialogDescription>
          </DialogHeader>
          {revokeError && (
            <p className="text-sm text-destructive" role="alert">
              {revokeError}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={revokePending}
              onClick={() => setRevokeTarget(null)}
            >
              Batal
            </Button>
            <Button disabled={revokePending} onClick={handleRevoke}>
              {revokePending ? "Mencabut..." : "Ya, Cabut Sesi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
