"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { listBranchWhatsAppSetup } from "../actions";
import type { BranchWhatsAppSetup } from "../contracts";
import { BranchConnectionDialog } from "./branch-connection-dialog";

const configurationLabels = {
  not_configured: "Pengaturan server WhatsApp belum diisi.",
  invalid_configuration:
    "Pengaturan server WhatsApp perlu diperiksa oleh pengelola sistem.",
  configured:
    "Pengaturan server sudah diisi. Pilih cabang untuk memeriksa atau menghubungkan WhatsApp.",
};

export function BranchWhatsAppSetupPanel({ companyId }: { companyId: number }) {
  const [data, setData] = useState<BranchWhatsAppSetup | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const dialogTrigger = useRef<HTMLButtonElement | null>(null);
  const [selected, setSelected] = useState<{ id: number; name: string } | null>(
    null,
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: Retry reloads the current query.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setData(null);
    void listBranchWhatsAppSetup({
      companyId,
      search: filter,
      page,
      pageSize: 20,
    })
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          setError(result.message);
          return;
        }
        if (page > result.data.pagination.totalPages) {
          setPage(result.data.pagination.totalPages);
          return;
        }
        setData(result.data);
      })
      .catch(() => {
        if (!cancelled) setError("Pengaturan WhatsApp gagal dimuat.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [companyId, filter, page, attempt]);

  return (
    <section
      aria-label="WhatsApp per cabang"
      className="space-y-4 rounded-md border p-4"
    >
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">WhatsApp per cabang</h2>
        <p className="text-sm text-muted-foreground">
          Setiap cabang menggunakan nomor WhatsApp sendiri. Isi pengaturan
          gateway di server untuk mengelola koneksi; pesan belum dapat dikirim
          dari panel ini.
        </p>
      </div>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setFilter(search);
        }}
      >
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="whatsapp-branch-search">
            Cari kode atau nama cabang
          </Label>
          <Input
            id="whatsapp-branch-search"
            className="min-h-11"
            maxLength={100}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Button type="submit" className="min-h-11">
          Cari cabang
        </Button>
      </form>
      {loading ? (
        <output>Memuat cabang WhatsApp…</output>
      ) : error ? (
        <div className="space-y-3">
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
          <Button
            variant="outline"
            className="min-h-11"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Muat ulang cabang
          </Button>
        </div>
      ) : (
        data && (
          <>
            {data.gatewayConfiguration && (
              <p className="text-sm text-muted-foreground">
                {configurationLabels[data.gatewayConfiguration]}
              </p>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Kode cabang</TableHead>
                  <TableHead scope="col">Nama cabang</TableHead>
                  <TableHead scope="col">Kantor</TableHead>
                  <TableHead scope="col">WhatsApp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell>{branch.code}</TableCell>
                    <TableCell>{branch.name}</TableCell>
                    <TableCell>{branch.officeName}</TableCell>
                    <TableCell>
                      {data.connectionAvailable ? (
                        <Button
                          variant="outline"
                          className="min-h-11"
                          onClick={(event) => {
                            dialogTrigger.current = event.currentTarget;
                            setSelected(branch);
                          }}
                        >
                          Periksa WhatsApp {branch.name}
                        </Button>
                      ) : (
                        "Gateway belum siap"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!data.items.length && (
                  <TableRow>
                    <TableCell colSpan={4}>
                      Tidak ada cabang aktif yang sesuai dengan akses dan
                      pencarian Anda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm">
                {data.pagination.total} cabang · Halaman {page} dari{" "}
                {data.pagination.totalPages}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="min-h-11"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  Cabang sebelumnya
                </Button>
                <Button
                  variant="outline"
                  className="min-h-11"
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Cabang berikutnya
                </Button>
              </div>
            </div>
          </>
        )
      )}
      {selected && data && (
        <BranchConnectionDialog
          key={selected.id}
          branch={selected}
          canManage={data.canManageConnections}
          onClose={() => setSelected(null)}
          restoreFocus={() => dialogTrigger.current?.focus()}
        />
      )}
    </section>
  );
}
