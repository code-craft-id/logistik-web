import type { PreviewView } from "@/components/patterns/preview-contract";

export type PreviewRow = {
  id: string;
  fixture: true;
  values: Readonly<Record<string, string>>;
};

/** Generated UI fixtures, separate from all seeds, models and data-access code. */
export function makePreviewRows(view: PreviewView): PreviewRow[] {
  return Array.from({ length: 24 }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    const values: Record<string, string> = {};
    for (const column of view.columns) {
      const field = [...view.fields, ...(view.readOnlyFields ?? [])].find(
        (item) => item.key === column.key,
      );
      values[column.key] =
        column.type === "currency" ||
        column.type === "percent" ||
        /biaya|tarif|omset|saldo|balance|percent|komisi|harga|total.*(transaksi|tunai|bb|bl|transfer)|piutang/i.test(
          `${column.key} ${column.label}`,
        )
          ? "—"
          : field?.type === "checkbox"
            ? String(index % 2 === 0)
            : field?.type === "select"
              ? (field.options?.[index % (field.options.length || 1)] ??
                (index % 2 ? "Preview B" : "Preview A"))
              : /tanggal|date/i.test(`${column.key} ${column.label}`)
                ? `2026-01-${number}`
                : /status|aktif|active/i.test(`${column.key} ${column.label}`)
                  ? (view.fixtureStatus ??
                    field?.options?.[index % (field.options.length || 1)] ??
                    (index % 2 ? "Inactive" : "Active"))
                  : /(^id$|^no$|^No\.?$)/i.test(column.key)
                    ? number
                    : `Preview ${column.label} ${number}`;
    }
    for (const filter of view.filters ?? []) {
      if (filter.type === "date" || filter.type === "month") continue;
      if (filter.key === "year") {
        values.year = "2026";
        continue;
      }
      if (!values[filter.key])
        values[filter.key] =
          filter.options?.[index % (filter.options.length || 1)] ??
          (index % 2 ? "Preview B" : "Preview A");
    }
    values.__fixtureDate = `2026-01-${number}`;
    return { id: `preview-${view.id}-${number}`, fixture: true, values };
  });
}
