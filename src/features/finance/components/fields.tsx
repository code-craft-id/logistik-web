import { FormField } from "@/components/patterns/form-field";
import { Input } from "@/components/ui/input";

export type Choice = { id: number | string; name: string };
export function FinanceField({
  prefix,
  name,
  label,
  type = "text",
  value,
  options,
  optional = false,
}: {
  prefix: string;
  name: string;
  label: string;
  type?: string;
  value?: string | number;
  options?: Choice[];
  optional?: boolean;
}) {
  const id = `${prefix}-${name}`;
  return (
    <FormField id={id} label={label}>
      {options ? (
        <select
          id={id}
          name={name}
          required={!optional}
          defaultValue={value ?? ""}
          className="min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base md:text-sm"
        >
          <option value="">Pilih…</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      ) : (
        <Input
          className="min-h-11"
          id={id}
          name={name}
          type={type}
          defaultValue={value}
          required={!optional}
          maxLength={name === "reason" ? 500 : 160}
        />
      )}
    </FormField>
  );
}
