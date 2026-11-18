"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import {
  type ChangeEvent,
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string; disabled?: boolean };
type OptionProps = {
  value?: string | number;
  children?: ReactNode;
  disabled?: boolean;
};

const text = (node: ReactNode): string =>
  Children.toArray(node)
    .map((n) =>
      typeof n === "string" || typeof n === "number"
        ? String(n)
        : isValidElement<{ children?: ReactNode }>(n)
          ? text(n.props.children)
          : "",
    )
    .join("");

/** Collect <option> children (also inside fragments/optgroups). */
function collect(children: ReactNode, out: Option[] = []): Option[] {
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const el = child as ReactElement<OptionProps & { children?: ReactNode }>;
    if (el.type === "option")
      out.push({
        value: String(el.props.value ?? text(el.props.children)),
        label: text(el.props.children),
        disabled: el.props.disabled,
      });
    else collect(el.props.children, out);
  });
  return out;
}

export type ComboSelectProps = {
  id?: string;
  name?: string;
  value?: string | number;
  defaultValue?: string | number | readonly string[];
  required?: boolean;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
};

/**
 * Drop-in replacement for <select> with a type-to-filter list. A visually
 * hidden native <select> (same id, name and <option> children) stays the form
 * control: it submits the value, runs `required` validation, follows form
 * reset and keeps <label for> associations; the combobox is a view over it.
 */
export function ComboSelect({
  id,
  name,
  value: controlled,
  defaultValue,
  required,
  disabled,
  className,
  children,
  onChange,
  ...aria
}: ComboSelectProps) {
  const options = useMemo(() => collect(children), [children]);
  const initial = String(defaultValue ?? options[0]?.value ?? "");
  const [inner, setInner] = useState(initial);
  const value = controlled !== undefined ? String(controlled) : inner;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const hidden = useRef<HTMLSelectElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const listId = useId();
  const autoId = useId();
  const selectId = id ?? autoId;
  const triggerId = `${selectId}-combo`;
  const [labelText, setLabelText] = useState<string | undefined>();
  // Name the visible combobox from the <label for> that targets the select.
  useEffect(() => {
    const label = document.querySelector(
      `label[for="${CSS.escape(selectId)}"]`,
    );
    setLabelText(label?.textContent?.trim() || undefined);
  }, [selectId]);

  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? options.filter((o) => o.label.toLowerCase().includes(q))
      : options;
  }, [options, query]);

  // Restore the default on <form>.reset() like a native select.
  useEffect(() => {
    const form = hidden.current?.form;
    if (!form) return;
    const reset = () => setInner(initial);
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [initial]);
  useEffect(() => {
    if (!open) return;
    search.current?.focus();
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  function choose(option: Option) {
    if (option.disabled) return;
    if (controlled === undefined) {
      setInner(option.value);
      if (hidden.current) hidden.current.value = option.value;
    }
    setOpen(false);
    setQuery("");
    document.getElementById(triggerId)?.focus();
    onChange?.({
      target: { value: option.value, name },
      currentTarget: { value: option.value, name },
    } as unknown as ChangeEvent<HTMLSelectElement>);
  }

  return (
    <div ref={root} className="relative min-w-0">
      <select
        ref={hidden}
        id={selectId}
        name={name}
        // Uncontrolled like a native select unless a value prop is given.
        {...(controlled !== undefined ? { value } : { defaultValue: initial })}
        required={required}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        onFocus={() => document.getElementById(triggerId)?.focus()}
        onInvalid={() => document.getElementById(triggerId)?.focus()}
        onChange={(event) => {
          if (controlled === undefined) setInner(event.target.value);
          onChange?.(event);
        }}
        className="sr-only"
      >
        {children}
      </select>
      <button
        id={triggerId}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        aria-label={aria["aria-label"] ?? labelText}
        aria-describedby={aria["aria-describedby"]}
        aria-invalid={aria["aria-invalid"]}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(event) => {
          if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
            event.preventDefault();
            setActive(
              Math.max(
                0,
                filtered.findIndex((o) => o.value === value),
              ),
            );
            setOpen(true);
          }
        }}
        className={cn(
          "flex min-h-11 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-left text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
      >
        <span
          className={cn(
            "truncate",
            !selected?.value && "text-muted-foreground",
          )}
        >
          {selected?.label ?? ""}
        </span>
        <ChevronDown
          className="size-4 shrink-0 opacity-60"
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="absolute left-0 z-50 mt-1 w-full min-w-56 rounded-md border bg-popover text-popover-foreground shadow-md">
          <div className="flex items-center gap-2 border-b px-3">
            <Search className="size-4 shrink-0 opacity-60" aria-hidden="true" />
            <input
              ref={search}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActive((i) => Math.min(i + 1, filtered.length - 1));
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActive((i) => Math.max(i - 1, 0));
                } else if (event.key === "Enter") {
                  event.preventDefault();
                  const option = filtered[active];
                  if (option) choose(option);
                } else if (event.key === "Escape") {
                  event.preventDefault();
                  setOpen(false);
                  document.getElementById(triggerId)?.focus();
                } else if (event.key === "Tab") setOpen(false);
              }}
              placeholder="Cari…"
              aria-label="Cari pilihan"
              aria-controls={listId}
              aria-activedescendant={
                filtered[active] ? `${listId}-${active}` : undefined
              }
              className="h-10 w-full min-w-0 bg-transparent text-sm outline-none"
            />
          </div>
          <div
            id={listId}
            role="listbox"
            aria-labelledby={triggerId}
            className="max-h-64 overflow-y-auto p-1"
          >
            {filtered.length ? (
              filtered.map((option, index) => (
                <div
                  key={`${option.value}-${index}`}
                  id={`${listId}-${index}`}
                  role="option"
                  tabIndex={-1}
                  aria-selected={option.value === value}
                  aria-disabled={option.disabled || undefined}
                  onMouseEnter={() => setActive(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(option)}
                  onKeyDown={() => {}}
                  className={cn(
                    "flex min-h-10 cursor-pointer items-center gap-2 rounded-sm px-2 text-sm",
                    index === active && "bg-accent text-accent-foreground",
                    option.disabled && "cursor-not-allowed opacity-50",
                  )}
                >
                  <Check
                    className={cn(
                      "size-4 shrink-0",
                      option.value !== value && "invisible",
                    )}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 [overflow-wrap:anywhere]">
                    {option.label || "—"}
                  </span>
                </div>
              ))
            ) : (
              <p className="px-2 py-3 text-sm text-muted-foreground">
                Tidak ada yang cocok
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
