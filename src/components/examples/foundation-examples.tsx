"use client";

import { Search } from "lucide-react";
import { type FormEvent, useState } from "react";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/patterns/content-state";
import { FilterBar } from "@/components/patterns/filter-bar";
import { FormField } from "@/components/patterns/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
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
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

const examples = [
  {
    id: "UI-001",
    name: "Navigation",
    category: "Shell",
    detail: "Active routes and unavailable destinations",
  },
  {
    id: "UI-002",
    name: "Table",
    category: "Data display",
    detail: "Column headings and horizontal scrolling",
  },
  {
    id: "UI-003",
    name: "Form fields",
    category: "Data entry",
    detail: "Labels, hints, and validation feedback",
  },
  {
    id: "UI-004",
    name: "Dialog",
    category: "Feedback",
    detail: "Focus containment and dismissal",
  },
  {
    id: "UI-005",
    name: "Content states",
    category: "Feedback",
    detail: "Loading, empty, and error presentation",
  },
];

export function FoundationExamples() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [view, setView] = useState("Rows");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [checked, setChecked] = useState(false);
  const rows = examples.filter(
    (row) =>
      row.name.toLowerCase().includes(search.trim().toLowerCase()) &&
      (category === "All categories" || row.category === category),
  );

  function resetExamples() {
    setSearch("");
    setCategory("All categories");
    setView("Rows");
  }

  function checkExample(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setChecked(false);
    if (!name.trim()) {
      setError("Enter an example name to check this field.");
      event.currentTarget
        .querySelector<HTMLInputElement>("#example-name")
        ?.focus();
      return;
    }
    setError("");
    setChecked(true);
  }

  return (
    <div className="space-y-10">
      <section
        id="table-examples"
        aria-labelledby="table-heading"
        className="scroll-mt-6 space-y-4"
      >
        <div>
          <h2 id="table-heading" className="text-lg font-semibold">
            Table & filters
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Filter this pattern catalogue or select a state to inspect its
            presentation.
          </p>
        </div>
        <div className="min-w-0 rounded-lg border">
          <FilterBar>
            <div className="min-w-0 flex-1 basis-56 space-y-2">
              <Label htmlFor="example-search">Search patterns</Label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="example-search"
                  type="search"
                  className="min-h-11 pl-9"
                  placeholder="Search by pattern name"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>
            <div className="min-w-0 flex-1 basis-44 space-y-2">
              <Label htmlFor="example-category">Category</Label>
              <select
                id="example-category"
                className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {[
                  "All categories",
                  "Shell",
                  "Data display",
                  "Data entry",
                  "Feedback",
                ].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
            <div className="min-w-0 flex-1 basis-36 space-y-2">
              <Label htmlFor="example-state">Example state</Label>
              <select
                id="example-state"
                className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={view}
                onChange={(event) => setView(event.target.value)}
              >
                {["Rows", "Loading", "Empty", "Error"].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
            <Button
              variant="outline"
              className="min-h-11"
              onClick={resetExamples}
            >
              Reset examples
            </Button>
          </FilterBar>
          {view === "Loading" ? (
            <LoadingState label="Example loading state" />
          ) : view === "Error" ? (
            <ErrorState
              title="Example content could not load"
              description="This is a simulated error. Return to the example rows to continue."
              action={
                <Button
                  variant="outline"
                  className="min-h-11"
                  onClick={resetExamples}
                >
                  Return to examples
                </Button>
              }
            />
          ) : view === "Empty" || rows.length === 0 ? (
            <EmptyState
              title={
                view === "Empty"
                  ? "Example empty state"
                  : "No matching patterns"
              }
              description="Reset the examples to see all synthetic rows. No operational records are involved."
              action={
                <Button
                  variant="outline"
                  className="min-h-11"
                  onClick={resetExamples}
                >
                  Reset examples
                </Button>
              }
            />
          ) : (
            <Table aria-label="Synthetic UI pattern examples">
              <TableCaption className="px-4 pb-4 text-left">
                Synthetic presentation fixtures. Scroll the table horizontally
                on smaller screens.
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col" className="px-4">
                    Reference
                  </TableHead>
                  <TableHead scope="col">Pattern</TableHead>
                  <TableHead scope="col">Category</TableHead>
                  <TableHead scope="col">Demonstrates</TableHead>
                  <TableHead scope="col" className="pr-4">
                    Content
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="px-4 py-4 font-mono text-xs tabular-nums text-muted-foreground">
                      {row.id}
                    </TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.category}</TableCell>
                    <TableCell>{row.detail}</TableCell>
                    <TableCell className="pr-4">
                      <Badge variant="secondary">Example</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <output className="block border-t px-4 py-3 text-xs text-muted-foreground">
            {view === "Rows"
              ? `${rows.length} of ${examples.length} example patterns`
              : `${view} state preview`}
          </output>
        </div>
      </section>
      <div className="grid gap-10 xl:grid-cols-2">
        <section
          id="form-examples"
          aria-labelledby="form-heading"
          className="scroll-mt-6 space-y-4"
        >
          <div>
            <h2 id="form-heading" className="text-lg font-semibold">
              Form & validation
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Check an empty field to inspect its error state. Nothing is saved.
            </p>
          </div>
          <form noValidate onSubmit={checkExample} className="space-y-5">
            <FormField
              id="example-name"
              label="Example name (required)"
              hint="Use any short label. This is not a business record."
              error={error}
            >
              <Input
                id="example-name"
                className="min-h-11"
                required
                maxLength={80}
                value={name}
                aria-invalid={Boolean(error)}
                aria-describedby={`example-name-hint${error ? " example-name-error" : ""}`}
                onChange={(event) => {
                  setName(event.target.value);
                  setError("");
                  setChecked(false);
                }}
              />
            </FormField>
            <FormField
              id="example-note"
              label="Example note"
              hint="Optional, local presentation only."
            >
              <Textarea
                id="example-note"
                aria-describedby="example-note-hint"
                maxLength={240}
              />
            </FormField>
            <FormField
              id="example-disabled"
              label="Unavailable field"
              hint="Disabled control example."
            >
              <Input
                id="example-disabled"
                aria-describedby="example-disabled-hint"
                disabled
                value="Unavailable in this preview"
              />
            </FormField>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" className="min-h-11">
                Check example
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled
                className="min-h-11"
              >
                Save unavailable
              </Button>
            </div>
            <output className="block min-h-6 text-sm text-muted-foreground">
              {checked ? "Example checked locally. Nothing was saved." : ""}
            </output>
          </form>
        </section>
        <section
          id="dialog-examples"
          aria-labelledby="dialog-heading"
          className="scroll-mt-6 space-y-4"
        >
          <div>
            <h2 id="dialog-heading" className="text-lg font-semibold">
              Dialog & interaction
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              An isolated preview for keyboard and dismissal behavior.
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="min-h-11">
                Inspect example dialog
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Example dialog</DialogTitle>
                <DialogDescription>
                  Presentation only. Closing this dialog does not change or save
                  any records.
                </DialogDescription>
              </DialogHeader>
              <p className="text-sm leading-6 text-muted-foreground">
                Use Tab and Shift+Tab to move between controls. Press Escape or
                use a close control to return to the trigger.
              </p>
              <DialogFooter>
                <DialogClose asChild>
                  <Button className="min-h-11">Close example</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <div className="border-t pt-5">
            <h3 className="text-sm font-semibold">State examples</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Use “Example state” above the table to compare skeleton loading,
              empty content, and recoverable errors in the same space.
            </p>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              These controls demonstrate interface behavior. They do not connect
              to authentication, branch permissions, or business services.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
