"use client";

import { Tabs } from "radix-ui";
import { useId, useRef, useState } from "react";
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
  const nextPicture = useRef(1);
  const [pictures, setPictures] = useState([
    { id: 0, file: "", detail: "", url: "" },
  ]);
  function fields(group?: string) {
    const items = view.fields.filter(
      (field) => !group || (field.group ?? groups[0]) === group,
    );
    function renderFields(fields: typeof items) {
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => (
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
      );
    }
    const sections = [
      ...new Set(
        items
          .map((field) => field.section)
          .filter((section): section is string => !!section),
      ),
    ];
    return items.length ? (
      sections.length ? (
        <div className="space-y-5">
          {sections.map((section) => (
            <fieldset key={section} className="space-y-4 rounded-lg border p-4">
              <legend className="px-2 text-sm font-semibold">{section}</legend>
              {renderFields(items.filter((field) => field.section === section))}
            </fieldset>
          ))}
        </div>
      ) : (
        renderFields(items)
      )
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
      {view.attachments && (
        <section aria-label="Gambar" className="space-y-4 border-t pt-4">
          <h3 className="text-sm font-semibold">Gambar</h3>
          {readOnly ? (
            <p className="text-sm text-muted-foreground">
              No files attached to this synthetic preview record.
            </p>
          ) : (
            <>
              {pictures.map((picture, index) => (
                <fieldset
                  key={picture.id}
                  className="space-y-3 rounded-lg border p-4"
                >
                  <legend className="px-2 text-sm">Gambar {index + 1}</legend>
                  {(
                    [
                      ["file", "Upload gambar", "file"],
                      ["detail", "Detail gambar", "text"],
                      ["url", "URL gambar", "url"],
                    ] as const
                  ).map(([key, label, type]) => (
                    <PreviewField
                      key={key}
                      field={{ key, label, type }}
                      id={`${prefix}-picture-${picture.id}-${key}`}
                      value={picture[key]}
                      onChange={(value) =>
                        setPictures((current) =>
                          current.map((item) =>
                            item.id === picture.id
                              ? { ...item, [key]: value }
                              : item,
                          ),
                        )
                      }
                    />
                  ))}
                  {pictures.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11"
                      aria-label={`Hapus gambar ${index + 1}`}
                      onClick={() =>
                        setPictures((current) =>
                          current.filter((item) => item.id !== picture.id),
                        )
                      }
                    >
                      Hapus gambar
                    </Button>
                  )}
                </fieldset>
              ))}
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={() => {
                  const id = nextPicture.current++;
                  setPictures((current) => [
                    ...current,
                    { id, file: "", detail: "", url: "" },
                  ]);
                }}
              >
                Tambah Gambar
              </Button>
            </>
          )}
        </section>
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
