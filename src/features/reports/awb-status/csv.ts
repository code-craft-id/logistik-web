import { businessDateTimeString } from "@/lib/date/business-date";
import { csvQuote, csvText } from "../transaction-details/csv";
import { awbStatusTable } from "./columns";
import type { AwbStatusResult } from "./contracts";

export function awbStatusCsv(result: AwbStatusResult): string {
  const { columns, rows } = awbStatusTable(result);
  const header = columns.map((column) => csvQuote(column.label)).join(",");
  const lines = rows.map((row) =>
    row.values
      .map((value, index) =>
        columns[index].numeric || typeof value === "number"
          ? csvQuote(value === null ? "" : String(value))
          : csvText(
              typeof value === "string" && /^\d{4}-\d{2}-\d{2}T.*Z$/.test(value)
                ? businessDateTimeString(value)
                : value,
            ),
      )
      .join(","),
  );
  return `${[header, ...lines].join("\r\n")}\r\n`;
}
