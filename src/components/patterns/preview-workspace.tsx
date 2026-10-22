"use client";

import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { Tabs } from "radix-ui";
import { Fragment, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  makePreviewRows,
  type PreviewRow,
} from "@/components/examples/legacy-fixtures";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ImportPreview } from "./import-preview";
import type { PreviewScreen, PreviewView } from "./preview-contract";
import { PreviewField } from "./preview-field";
import { PreviewForm } from "./preview-form";

function slug(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function hasHash(view: PreviewView, hash: string): boolean {
  return (
    view.id === hash ||
    [...(view.children ?? []), ...(view.supplementalViews ?? [])].some(
      (child) => hasHash(child, hash),
    )
  );
}

export function PreviewWorkspace({ screen }: { screen: PreviewScreen }) {
  const [active, setActive] = useState(screen.views[0]?.id ?? "");
  useEffect(() => {
    const update = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      const found = screen.views.find((view) => hasHash(view, hash));
      if (found) setActive(found.id);
    };
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, [screen.views]);
  const view =
    screen.views.find((item) => item.id === active) ?? screen.views[0];
  if (!view) return null;
  return (
    <div className="min-w-0 space-y-4">
      {screen.views.length > 1 && (
        <Tabs.Root
          value={active}
          onValueChange={(value) => {
            setActive(value);
            history.replaceState(null, "", `#${value}`);
          }}
        >
          <Tabs.List
            aria-label={`${screen.title} sections`}
            className="flex flex-wrap gap-1 border-b"
          >
            {screen.views.map((item) => (
              <Tabs.Trigger
                key={item.id}
                value={item.id}
                className="min-h-11 border-b-2 border-transparent px-4 py-2 text-sm font-medium data-[state=active]:border-primary data-[state=active]:text-primary"
              >
                {item.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          {screen.views.map((item) => (
            <Tabs.Content key={item.id} value={item.id}>
              <PreviewViewContent view={item} />
            </Tabs.Content>
          ))}
        </Tabs.Root>
      )}
      {screen.views.length === 1 && <PreviewViewContent view={view} />}
    </div>
  );
}

function PreviewViewContent({ view }: { view: PreviewView }) {
  const [active, setActive] = useState(view.children?.[0]?.id ?? "");
  useEffect(() => {
    const update = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (view.children?.some((child) => child.id === hash)) setActive(hash);
    };
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, [view.children]);
  return view.children?.length ? (
    <Tabs.Root
      value={active}
      onValueChange={(value) => {
        setActive(value);
        history.replaceState(null, "", `#${value}`);
      }}
    >
      <Tabs.List
        aria-label={`${view.label} subsections`}
        className="my-4 flex flex-wrap gap-1"
      >
        {view.children.map((child) => (
          <Tabs.Trigger
            key={child.id}
            value={child.id}
            className="min-h-11 rounded-md border px-3 py-2 text-sm data-[state=active]:border-primary data-[state=active]:bg-accent data-[state=active]:text-primary"
          >
            {child.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {view.children.map((child) => (
        <Tabs.Content key={child.id} value={child.id}>
          <PreviewList view={child} />
        </Tabs.Content>
      ))}
    </Tabs.Root>
  ) : (
    <PreviewList view={view} />
  );
}

type Overlay = { action: string; row?: PreviewRow };

function PreviewList({ view }: { view: PreviewView }) {
  const id = useId();
  const rows = useMemo(() => makePreviewRows(view), [view]);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [applied, setApplied] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [sort, setSort] = useState({
    key: view.columns[0]?.key ?? "",
    direction: 1,
  });
  const [state, setState] = useState("Rows");
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const returnFocus = useRef<string>("");
  const filtered = useMemo(
    () =>
      rows
        .filter((row) => {
          if (
            !Object.values(row.values)
              .join(" ")
              .toLowerCase()
              .includes(query.toLowerCase())
          )
            return false;
          return Object.entries(applied).every(
            ([key, value]) =>
              !value ||
              key === "dateFrom" ||
              key === "dateTo" ||
              key === "month" ||
              row.values[key] === value,
          );
        })
        .filter((row) => {
          const date = Object.values(row.values).find((value) =>
            /^2026-01-\d\d$/.test(value),
          );
          return (
            (!applied.dateFrom || !date || date >= applied.dateFrom) &&
            (!applied.dateTo || !date || date <= applied.dateTo) &&
            (!applied.month || !date || date.startsWith(applied.month))
          );
        })
        .sort(
          (a, b) =>
            sort.direction *
            (a.values[sort.key] ?? "").localeCompare(
              b.values[sort.key] ?? "",
              undefined,
              { numeric: true },
            ),
        ),
    [rows, query, applied, sort],
  );
  const count = state === "Empty" ? 0 : filtered.length;
  const pages = Math.max(1, Math.ceil(count / size));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * size, currentPage * size);
  const actions = view.actions ?? ["Edit", "Hapus"];
  function open(action: string, row?: PreviewRow, trigger?: string) {
    returnFocus.current = trigger ?? `${id}-add`;
    setOverlay({ action, row });
  }
  function reset() {
    setDraft("");
    setQuery("");
    setFilters({});
    setApplied({});
    setPage(1);
    setState("Rows");
  }
  const formView: PreviewView = overlay?.action.includes("Harga")
    ? {
        ...view,
        formGroups: [],
        fields: [
          { key: "pricePerKoli", label: "Harga / Koli", required: true },
        ],
      }
    : overlay?.action.includes("Trucking")
      ? {
          ...view,
          formGroups: [],
          fields: [{ key: "trucking", label: "Trucking", required: true }],
        }
      : (view.actionForms?.[overlay?.action ?? ""] ?? view);
  return (
    <div className="space-y-4">
      {view.inlineForm && (
        <section
          aria-label={`${view.label} entry`}
          className="rounded-xl border bg-background p-5"
        >
          <h2 className="mb-4 text-base font-semibold">Tambah {view.label}</h2>
          <PreviewForm view={view} />
        </section>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">
          {view.tableTitle ?? view.label}
        </h2>
        <div className="flex flex-wrap gap-2">
          {view.toolsAsMenu ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  id={`${id}-tools`}
                  variant="outline"
                  className="min-h-11"
                >
                  Tools
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(view.tools ?? []).map((tool) => (
                  <DropdownMenuItem
                    key={tool}
                    disabled={!/import data/i.test(tool)}
                    onSelect={() => open(tool, undefined, `${id}-tools`)}
                  >
                    {tool}
                    {!/import data/i.test(tool) && " — unavailable"}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            (view.tools ?? []).map((tool) => (
              <Button
                key={tool}
                id={`${id}-${slug(tool)}`}
                variant="outline"
                className="min-h-11"
                disabled={
                  !/import data/i.test(tool) && !view.actionForms?.[tool]
                }
                onClick={() => open(tool, undefined, `${id}-${slug(tool)}`)}
              >
                {tool}
                {!/import data/i.test(tool) && !view.actionForms?.[tool] && (
                  <span className="sr-only"> — unavailable</span>
                )}
              </Button>
            ))
          )}
          {view.fields.length > 0 && !view.inlineForm && (
            <Button
              id={`${id}-add`}
              className="min-h-11"
              onClick={() => open("Tambah")}
            >
              <Plus aria-hidden="true" />
              {view.createLabel ?? "Tambah"}{" "}
              <span className="sr-only">{view.label} preview</span>
            </Button>
          )}
        </div>
      </div>
      {view.summaries?.length ? (
        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {view.summaries.map((label) => (
            <div key={label} className="rounded-lg border bg-background p-4">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="mt-2 font-semibold">Unavailable</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <div className="min-w-0 overflow-hidden rounded-xl border bg-background">
        <form
          className="flex flex-wrap items-end gap-3 border-b bg-muted/40 p-4"
          aria-label={`${view.label} filters`}
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(draft);
            setApplied({ ...filters });
            setPage(1);
          }}
        >
          {!view.hideSearch && (
            <div className="min-w-0 flex-1 basis-52 space-y-2">
              <Label htmlFor={`${id}-search`}>
                {view.searchLabel ?? "Pencarian"}
              </Label>
              <Input
                id={`${id}-search`}
                type="search"
                placeholder="Cari preview…"
                value={draft}
                onInput={(event) => setDraft(event.currentTarget.value)}
                className="min-h-11"
              />
            </div>
          )}
          {(view.filters ?? []).map((field) => (
            <div key={field.key} className="min-w-0 flex-1 basis-40">
              <PreviewField
                field={field}
                id={`${id}-filter-${encodeURIComponent(field.key)}`}
                value={filters[field.key] ?? ""}
                onChange={(value) =>
                  setFilters((current) => ({ ...current, [field.key]: value }))
                }
              />
            </div>
          ))}
          <Button type="submit" className="min-h-11">
            <Search aria-hidden="true" />
            Show
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={reset}
          >
            <RefreshCw aria-hidden="true" />
            Reset
          </Button>
        </form>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-3 text-sm">
          <label className="flex items-center gap-2">
            Show entries
            <select
              className="min-h-11 rounded-md border border-input bg-background px-3"
              value={size}
              onChange={(event) => {
                setSize(Number(event.currentTarget.value));
                setPage(1);
              }}
            >
              {[10, 25, 50].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-muted-foreground">
            Preview state
            <select
              className="min-h-11 rounded-md border border-input bg-background px-3 text-foreground"
              value={state}
              onChange={(event) => setState(event.currentTarget.value)}
            >
              {["Rows", "Loading", "Empty", "Error"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        </div>
        {state === "Loading" ? (
          <div className="space-y-3 p-6">
            <output className="text-sm">
              Loading state preview — no request is running.
            </output>
            {[1, 2, 3].map((n) => (
              <Skeleton key={n} className="h-9 w-full" />
            ))}
          </div>
        ) : state === "Error" ? (
          <div role="alert" className="space-y-3 p-6">
            <p className="text-sm">
              Simulated error. No operational request was made.
            </p>
            <Button
              variant="outline"
              className="min-h-11"
              onClick={() => setState("Rows")}
            >
              Return to preview rows
            </Button>
          </div>
        ) : (
          <Table>
            <TableCaption className="px-3 pb-3">
              Synthetic presentation fixtures only. Scroll horizontally to see
              every column.
            </TableCaption>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {view.columns.map((column) => (
                  <TableHead
                    key={column.key}
                    scope="col"
                    aria-sort={
                      sort.key === column.key
                        ? sort.direction === 1
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <button
                      type="button"
                      className="flex min-h-11 items-center gap-2 text-left"
                      onClick={() =>
                        setSort((current) => ({
                          key: column.key,
                          direction:
                            current.key === column.key ? -current.direction : 1,
                        }))
                      }
                    >
                      {column.label}
                      {sort.key === column.key ? (
                        sort.direction === 1 ? (
                          <ArrowUp className="size-3" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="size-3" aria-hidden="true" />
                        )
                      ) : null}
                    </button>
                  </TableHead>
                ))}
                {actions.length > 0 && <TableHead scope="col">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {count === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={view.columns.length + (actions.length ? 1 : 0)}
                    className="h-28 text-center"
                  >
                    Tidak ada data · No matching preview rows.
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((row) => (
                  <Fragment key={row.id}>
                    <TableRow>
                      {view.columns.map((column) => (
                        <TableCell key={column.key} className="px-3 py-3">
                          {/status|aktif|active/i.test(
                            `${column.key} ${column.label}`,
                          ) ? (
                            <Badge variant="secondary">
                              {row.values[column.key] === "true"
                                ? "Active"
                                : row.values[column.key] === "false"
                                  ? "Inactive"
                                  : row.values[column.key]}
                            </Badge>
                          ) : (
                            row.values[column.key]
                          )}
                        </TableCell>
                      ))}
                      {actions.length > 0 && (
                        <TableCell>
                          {view.detailLabels?.length ? (
                            <Button
                              variant="ghost"
                              className="min-h-11"
                              aria-expanded={expanded === row.id}
                              aria-controls={`${id}-detail-${row.id}`}
                              onClick={() =>
                                setExpanded((current) =>
                                  current === row.id ? null : row.id,
                                )
                              }
                            >
                              Detail
                            </Button>
                          ) : (
                            <DropdownMenu modal={false}>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  id={`${id}-${row.id}`}
                                  className="size-11"
                                  aria-label={`Actions ${row.id}`}
                                >
                                  <Ellipsis aria-hidden="true" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {actions.map((action) => (
                                  <DropdownMenuItem
                                    key={action}
                                    onSelect={() =>
                                      open(action, row, `${id}-${row.id}`)
                                    }
                                  >
                                    {action}
                                    {/approve|selesai|revisi|close|buka link/i.test(
                                      action,
                                    ) && " — unavailable"}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                    {view.detailLabels?.length && (
                      <TableRow
                        id={`${id}-detail-${row.id}`}
                        hidden={expanded !== row.id}
                      >
                        <TableCell
                          colSpan={view.columns.length + 1}
                          className="whitespace-normal bg-muted/40 p-4"
                        >
                          <dl className="grid gap-4 sm:grid-cols-3">
                            {view.detailLabels.map((label) => (
                              <div key={label}>
                                <dt className="text-xs text-muted-foreground">
                                  {label}
                                </dt>
                                <dd className="mt-1 text-sm">
                                  {row.values[
                                    view.columns.find(
                                      (column) => column.label === label,
                                    )?.key ?? slug(label)
                                  ] ?? `Preview ${label} ${row.id.slice(-2)}`}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))
              )}
            </TableBody>
            {view.footerLabel && (
              <TableFooter>
                <TableRow>
                  <TableCell
                    colSpan={view.columns.length + (actions.length ? 1 : 0)}
                  >
                    {view.footerLabel} · Unavailable — no financial totals
                    calculated
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t p-3 text-sm">
          <output aria-live="polite">
            {count} preview rows · Page {currentPage} of {pages}
          </output>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="min-h-11"
              aria-label="Previous page"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft aria-hidden="true" />
              Previous
            </Button>
            <Button
              variant="outline"
              className="min-h-11"
              aria-label="Next page"
              disabled={currentPage === pages}
              onClick={() => setPage(currentPage + 1)}
            >
              Next
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
      {view.supplementalViews?.length ? (
        <section aria-label="Detail Tagihan" className="space-y-4">
          <h2 className="text-base font-semibold">Detail Tagihan</h2>
          <PreviewWorkspace
            screen={{
              path: "",
              title: "Detail Tagihan",
              source: "FinancialReport.jsx",
              kind: "workspace",
              integration: "",
              views: view.supplementalViews,
            }}
          />
        </section>
      ) : null}
      <Dialog
        open={!!overlay}
        onOpenChange={(open) => {
          if (!open) setOverlay(null);
        }}
      >
        <DialogContent
          className="sm:max-w-4xl"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            document.getElementById(returnFocus.current)?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {overlay?.action} {view.label} — preview
            </DialogTitle>
            <DialogDescription>
              No production data, credentials or permissions are used. Changes
              are never saved.
            </DialogDescription>
          </DialogHeader>
          {overlay &&
            (/delete|hapus|approve|selesai|revisi|close|buka link/i.test(
              overlay.action,
            ) ? (
              <div className="space-y-4">
                <p className="text-sm">
                  This operational action is unavailable until its authorized
                  backend workflow is implemented.
                </p>
                <Button disabled>{overlay.action} — unavailable</Button>
              </div>
            ) : /import data/i.test(overlay.action) ? (
              <ImportPreview />
            ) : (
              <PreviewForm
                key={`${overlay.action}-${overlay.row?.id ?? "new"}`}
                view={{
                  ...formView,
                  fields: formView.fields.length
                    ? [
                        ...formView.fields,
                        ...(/detail|lihat/i.test(overlay.action) &&
                        !view.actionForms?.[overlay.action]
                          ? (formView.readOnlyFields ?? [])
                          : []),
                      ]
                    : view.columns.map((column) => ({
                        ...column,
                        type: "text",
                      })),
                }}
                row={overlay.row}
                readOnly={
                  /detail|lihat/i.test(overlay.action) &&
                  !view.actionForms?.[overlay.action]
                }
              />
            ))}
        </DialogContent>
      </Dialog>
    </div>
  );
}
