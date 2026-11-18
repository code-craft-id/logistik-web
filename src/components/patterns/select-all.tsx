"use client";

/** Checks or clears every checkbox with the given name in the same form. */
export function SelectAllCheckbox({
  name,
  label = "Pilih semua",
}: {
  name: string;
  label?: string;
}) {
  return (
    <label className="inline-flex min-h-11 items-center gap-2 text-sm">
      <input
        type="checkbox"
        className="size-4"
        onChange={(event) => {
          const form = event.currentTarget.form;
          if (!form) return;
          for (const box of form.querySelectorAll<HTMLInputElement>(
            `input[type="checkbox"][name="${name}"]`,
          ))
            box.checked = event.currentTarget.checked;
        }}
      />
      {label}
    </label>
  );
}
