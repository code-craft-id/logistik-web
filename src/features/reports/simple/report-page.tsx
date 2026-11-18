import Form from "next/form";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/patterns/content-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isAdministrator, permits } from "@/features/identity/permissions";
import { currentIdentity } from "@/features/identity/server/context";
import { prisma } from "@/lib/db";
import { simpleReports } from "./definitions";
import { type Cell, parseFilters, ROW_LIMIT } from "./framework";

const select =
  "min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm";
const show = (value: Cell | undefined) =>
  value === null || value === undefined || value === "" ? "—" : value;

/** Server-rendered simple report: filters, one scoped query, table, totals. */
export async function SimpleReportPage({
  id,
  route,
  searchParams,
}: {
  id: keyof typeof simpleReports;
  route: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const def = simpleReports[id];
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const actor = current.actor;
  if (!permits(actor, "view", def.resource))
    return (
      <EmptyState
        title="Akses ditolak"
        description={`Anda belum memiliki hak lihat untuk laporan ${def.title}.`}
      />
    );
  const admin = isAdministrator(actor);
  const [branches, query] = await Promise.all([
    prisma.branch.findMany({
      where: {
        deletedAt: null,
        ...(admin ? {} : { id: { in: actor.branchIds } }),
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    searchParams,
  ]);
  const parsed = parseFilters(query, actor.branchIds, admin);
  const values = parsed.ok
    ? {
        start: parsed.filters.start,
        end: parsed.filters.end,
        branchId: String(parsed.filters.branchId ?? ""),
      }
    : parsed;
  const result =
    parsed.ok && (admin || actor.branchIds.length)
      ? await prisma.$transaction((tx) => def.run(actor, parsed.filters, tx), {
          isolationLevel: "RepeatableRead",
        })
      : null;
  const usesPeriod = def.usesPeriod !== false;
  return (
    <div className="min-w-0 space-y-5 [overflow-wrap:anywhere]">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {def.title}
        </h1>
        <p className="max-w-prose text-sm text-muted-foreground">
          {def.definition}
        </p>
      </header>
      <Form
        action={route}
        className="grid items-end gap-4 rounded-lg border bg-background p-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {usesPeriod && (
          <>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="sr-start">Tanggal mulai (UTC)</Label>
              <Input
                id="sr-start"
                name="startDate"
                type="date"
                defaultValue={values.start}
                className="min-h-11"
              />
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="sr-end">Tanggal akhir (UTC)</Label>
              <Input
                id="sr-end"
                name="endDate"
                type="date"
                defaultValue={values.end}
                className="min-h-11"
              />
            </div>
          </>
        )}
        <div className="min-w-0 space-y-2">
          <Label htmlFor="sr-branch">Cabang</Label>
          <select
            id="sr-branch"
            name="branchId"
            defaultValue={values.branchId}
            className={select}
          >
            <option value="">Semua cabang yang diizinkan</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" className="min-h-11">
          Tampilkan
        </Button>
      </Form>
      {!parsed.ok && (
        <p
          role="alert"
          className="rounded-md border border-destructive p-3 text-sm text-destructive"
        >
          {parsed.message}
        </p>
      )}
      {parsed.ok && (
        <section
          aria-label={`Hasil ${def.title}`}
          className="min-w-0 rounded-lg border bg-background"
        >
          <p className="border-b p-4 text-sm text-muted-foreground">
            {usesPeriod
              ? `Periode ${parsed.filters.start} sampai ${parsed.filters.end} (UTC)`
              : "Posisi per hari ini"}
            {result ? ` · ${result.rows.length} baris` : ""}
          </p>
          {result?.truncated && (
            <output className="block border-b p-4 text-sm">
              Menampilkan {ROW_LIMIT} baris pertama. Persempit periode atau
              cabang untuk melihat semuanya.
            </output>
          )}
          {result?.rows.length ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[48rem]">
                <TableHeader>
                  <TableRow>
                    {result.columns.map((c) => (
                      <TableHead
                        key={c.key}
                        className={c.numeric ? "text-right" : undefined}
                      >
                        {c.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.rows.map((row, index) => (
                    <TableRow
                      // biome-ignore lint/suspicious/noArrayIndexKey: report rows have no stable id
                      key={index}
                    >
                      {result.columns.map((c) => (
                        <TableCell
                          key={c.key}
                          className={
                            c.numeric ? "text-right tabular-nums" : undefined
                          }
                        >
                          {show(row[c.key])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
                {result.totals && (
                  <TableFooter>
                    <TableRow>
                      {result.columns.map((c) => (
                        <TableCell
                          key={c.key}
                          className={`font-semibold ${c.numeric ? "text-right tabular-nums" : ""}`}
                        >
                          {result.totals?.[c.key] ?? ""}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </div>
          ) : (
            <EmptyState
              title="Tidak ada data"
              description="Tidak ada data untuk filter dan cakupan cabang Anda."
            />
          )}
        </section>
      )}
    </div>
  );
}
