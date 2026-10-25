"use client";
import { Download, Upload } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  commitPersonnelImport,
  previewPersonnelImport,
} from "../personnel-import-actions";
import {
  PERSONNEL_IMPORT_MAX_BYTES,
  type PersonnelImportKind,
  type PersonnelImportPreview,
  personnelImportDefinitions,
} from "../personnel-import-contracts";

export function PersonnelImportTools({
  kind,
  onImported,
}: {
  kind: PersonnelImportKind;
  onImported: () => void;
}) {
  "use no memo";
  // Infrequent file interactions and a bounded preview do not need compiler memoization.
  const { label } = personnelImportDefinitions[kind];
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PersonnelImportPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function process(commit: boolean) {
    if (!file || busy) return;
    setBusy(true);
    setError("");
    const form = new FormData();
    form.set("file", file);
    try {
      if (commit) {
        const response = await commitPersonnelImport(kind, form);
        if (!response.ok) {
          setError(response.message);
          setPreview(null);
          return;
        }
        setNotice(
          `${response.data.count} ${label.toLowerCase()} berhasil diimpor.`,
        );
        setOpen(false);
        setFile(null);
        setPreview(null);
        onImported();
      } else {
        setPreview(null);
        const response = await previewPersonnelImport(kind, form);
        if (response.ok) setPreview(response.data);
        else setError(response.message);
      }
    } catch {
      setError(
        "Permintaan gagal. Periksa koneksi lalu validasi ulang file sebelum mencoba lagi.",
      );
      setPreview(null);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" className="min-h-11">
          <a href={`/logistics/division/template/${kind}`} download>
            <Download aria-hidden="true" />
            Download Template {label}
          </a>
        </Button>
        <Dialog
          open={open}
          onOpenChange={(value) => {
            if (!busy) {
              setOpen(value);
              setError("");
              if (!value) {
                setFile(null);
                setPreview(null);
              }
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="min-h-11" onClick={() => setNotice("")}>
              <Upload aria-hidden="true" />
              Import {label}
            </Button>
          </DialogTrigger>
          <DialogContent
            className="sm:max-w-3xl"
            showCloseButton={!busy}
            onInteractOutside={(event) => {
              if (busy) event.preventDefault();
            }}
            onEscapeKeyDown={(event) => {
              if (busy) event.preventDefault();
            }}
          >
            <DialogHeader>
              <DialogTitle>Import {label}</DialogTitle>
              <DialogDescription>
                File .xls maksimal 512 KB dan 500 baris. Semua baris divalidasi
                sebelum disimpan bersama.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 rounded-md border bg-muted p-3 text-sm text-muted-foreground">
              <p>
                Gunakan kolom asli pada baris 3 dan isi data mulai baris 4. ID
                database dibuat otomatis; kolom ID dan ID cabang hasil rumus
                tidak dipakai.
              </p>
              <p>
                Isi CABANG dengan kode atau nama cabang lokal yang diizinkan.
                Status Y/N.{" "}
                {kind === "driver"
                  ? "KTP, telepon, dan SIM"
                  : "KTP dan telepon"}{" "}
                berformat Teks. Impor hanya menambah data baru.
              </p>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void process(false);
              }}
              className="space-y-3"
            >
              <Label htmlFor="personnel-import-file">
                File Excel {label} (.xls)
              </Label>
              <Input
                id="personnel-import-file"
                type="file"
                accept=".xls,application/vnd.ms-excel"
                disabled={busy}
                required
                className="min-h-11"
                onChange={(event) => {
                  const next = event.target.files?.[0] ?? null;
                  setPreview(null);
                  setError("");
                  setFile(null);
                  if (
                    next &&
                    (!next.name.toLowerCase().endsWith(".xls") ||
                      next.size > PERSONNEL_IMPORT_MAX_BYTES ||
                      !next.size)
                  ) {
                    setError("Pilih file .xls berukuran maksimal 512 KB.");
                    return;
                  }
                  setFile(next);
                }}
              />
              <Button
                type="submit"
                variant="outline"
                className="min-h-11"
                disabled={!file || busy}
              >
                {busy ? "Memproses…" : "Validasi File"}
              </Button>
            </form>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            {preview && (
              <div className="space-y-3">
                <output
                  className={
                    preview.valid
                      ? "text-sm text-primary"
                      : "text-sm text-destructive"
                  }
                >
                  {preview.count} baris diperiksa.{" "}
                  {preview.valid
                    ? "Semua baris valid dan siap disimpan."
                    : `${preview.issues.length} masalah ditemukan. Tidak ada data yang disimpan.`}
                </output>
                {preview.issues.length > 0 && (
                  <div
                    role="alert"
                    className="max-h-48 overflow-y-auto rounded-md border border-destructive p-3 text-sm"
                  >
                    <ul className="list-disc space-y-1 pl-4">
                      {preview.issues.slice(0, 50).map((issue, index) => (
                        <li key={`${issue.row}-${index}`}>
                          Baris {issue.row}: {issue.message}
                        </li>
                      ))}
                    </ul>
                    {preview.issues.length > 50 && (
                      <p>
                        Masih ada {preview.issues.length - 50} masalah lain.
                      </p>
                    )}
                  </div>
                )}
                {preview.rows.length > 0 && (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Pratinjau {preview.rows.length} dari {preview.count}{" "}
                      baris. KTP, SIM, dan telepon tidak ditampilkan di
                      pratinjau.
                    </p>
                    <section
                      className="max-h-60 overflow-auto rounded-md border"
                      aria-label={`Pratinjau import ${label}`}
                    >
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Baris Excel</TableHead>
                            <TableHead>Nama</TableHead>
                            <TableHead>Cabang</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {preview.rows.map((row) => (
                            <TableRow key={row.row}>
                              <TableCell>{row.row}</TableCell>
                              <TableCell>{row.name}</TableCell>
                              <TableCell>{row.branch}</TableCell>
                              <TableCell>
                                {row.status === "ACTIVE"
                                  ? "Aktif"
                                  : "Tidak aktif"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </section>
                  </>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                disabled={busy}
                onClick={() => {
                  setOpen(false);
                  setFile(null);
                  setPreview(null);
                }}
              >
                Batal
              </Button>
              <Button
                type="button"
                className="min-h-11"
                disabled={busy || !preview?.valid || !file}
                onClick={() => void process(true)}
              >
                <Upload aria-hidden="true" />
                {busy ? "Memproses…" : `Simpan ${preview?.count ?? 0} ${label}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {notice && (
        <output className="block text-sm text-primary">{notice}</output>
      )}
    </div>
  );
}
