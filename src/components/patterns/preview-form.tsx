"use client";

import { Tabs } from "radix-ui";
import { useId, useState } from "react";
import type { PreviewRow } from "@/components/examples/legacy-fixtures";
import { Button } from "@/components/ui/button";
import type { PreviewView } from "./preview-contract";
import { PreviewField } from "./preview-field";

export function PreviewForm({
  view,
  row,
  readOnly = false,
}: {
  view: PreviewView;
  row?: PreviewRow;
  readOnly?: boolean;
}) {
  const prefix = useId();
  const groups = view.formGroups?.length
    ? view.formGroups
    : [
        ...new Set(
          view.fields
            .map((field) => field.group)
            .filter((group): group is string => !!group),
        ),
      ];
  const [active, setActive] = useState(
    groups.includes(view.label) ? view.label : (groups[0] ?? "Fields"),
  );
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      view.fields.map((field) => [
        field.key,
        field.type === "password"
          ? ""
          : row?.values[field.key] === "—"
            ? ""
            : (row?.values[field.key] ?? ""),
      ]),
    ),
  );
  const [invalid, setInvalid] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  function fields(group?: string) {
    const items = view.fields.filter(
      (field) => !group || (field.group ?? groups[0]) === group,
    );
    return items.length ? (
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((field) => (
          <PreviewField
            key={field.key}
            field={field}
            id={`${prefix}-${encodeURIComponent(field.key)}`}
            value={values[field.key] ?? ""}
            onChange={(value) => {
              setValues((current) => ({ ...current, [field.key]: value }));
              setChecked(false);
            }}
            invalid={invalid === field.key}
            readOnly={readOnly}
          />
        ))}
      </div>
    ) : (
      <p className="rounded-lg border border-dashed bg-muted/50 p-6 text-sm text-muted-foreground">
        The legacy tab is a placeholder. No additional fields or rules are
        defined.
      </p>
    );
  }
  return (
    <form
      noValidate
      className="space-y-5"
      aria-label={`${view.label} form preview`}
      onSubmit={(event) => {
        event.preventDefault();
        const missing = view.fields.find(
          (field) => field.required && !values[field.key]?.trim(),
        );
        setInvalid(missing?.key ?? null);
        setChecked(!missing);
        if (missing) {
          setActive(missing.group ?? groups[0] ?? "Fields");
          requestAnimationFrame(() =>
            document
              .getElementById(`${prefix}-${encodeURIComponent(missing.key)}`)
              ?.focus(),
          );
        }
      }}
    >
      <p className="text-sm leading-6 text-muted-foreground">
        Presentation only. Use fictional values. Files remain on this device;
        nothing is uploaded. Saving and operational validation are unavailable.
      </p>
      {groups.length ? (
        <Tabs.Root value={active} onValueChange={setActive}>
          <Tabs.List
            aria-label={`${view.label} form sections`}
            className="mb-5 flex flex-wrap gap-1 border-b"
          >
            {groups.map((group) => (
              <Tabs.Trigger
                key={group}
                value={group}
                className="min-h-11 border-b-2 border-transparent px-4 py-2 text-sm data-[state=active]:border-primary data-[state=active]:text-primary"
              >
                {group}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          {groups.map((group) => (
            <Tabs.Content
              key={group}
              value={group}
              forceMount
              hidden={active !== group}
            >
              {fields(group)}
            </Tabs.Content>
          ))}
        </Tabs.Root>
      ) : (
        fields()
      )}
      <div className="flex flex-wrap items-center gap-3 border-t pt-4">
        {!readOnly && (
          <Button type="submit" variant="outline" className="min-h-11">
            Check preview
          </Button>
        )}
        <Button type="button" disabled className="min-h-11">
          Simpan — unavailable
        </Button>
        <span className="text-xs text-muted-foreground">
          Awaiting the owning PLT/domain implementation.
        </span>
      </div>
      <output
        aria-live="polite"
        className="block text-sm text-muted-foreground"
      >
        {checked
          ? "Preview fields checked. Nothing was saved."
          : invalid
            ? "Complete the highlighted preview field."
            : "No changes saved."}
      </output>
    </form>
  );
}
