"use client";
import { Check, ChevronDown, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Search and select share one input. Form submission always uses the selected ID. */
export function SearchSelect({
  id,
  name,
  label,
  value,
  selectedLabel,
  options,
  search,
  onSearchChange,
  onValueChange,
  loading = false,
  disabled = false,
  required = false,
  page = 1,
  pages = 1,
  onPageChange,
  error,
}: {
  id: string;
  name?: string;
  label: string;
  value: string;
  selectedLabel?: string;
  options: { id: number; name: string }[];
  search: string;
  onSearchChange: (value: string) => void;
  onValueChange: (value: string, label: string) => void;
  loading?: boolean;
  disabled?: boolean;
  required?: boolean;
  page?: number;
  pages?: number;
  onPageChange?: (page: number) => void;
  error?: string;
}) {
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [query, setQuery] = useState(search);
  useEffect(() => {
    if (!open || query === search) return;
    const timer = setTimeout(() => onSearchChange(query), 300);
    return () => clearTimeout(timer);
  }, [open, query, search, onSearchChange]);
  useEffect(() => {
    if (open && active >= 0)
      document
        .getElementById(`${listId}-${active}`)
        ?.scrollIntoView?.({ block: "nearest" });
  }, [open, active, listId]);
  const currentLabel =
    options.find((option) => String(option.id) === value)?.name ??
    selectedLabel ??
    (value ? `ID ${value}` : "");
  const choose = (next: string, text: string) => {
    onValueChange(next, text);
    setOpen(false);
    setActive(-1);
    input.current?.focus();
  };
  const pending = loading || (open && query !== search);
  const canChoose = !pending && !error;
  return (
    <fieldset
      className="relative min-w-0"
      aria-label={`${label} selector`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
          setActive(-1);
        }
      }}
    >
      {name && (
        <input type="hidden" name={name} value={value} disabled={disabled} />
      )}
      <div className="relative">
        <Input
          ref={input}
          id={id}
          role="combobox"
          autoComplete="off"
          aria-label={label}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && canChoose && active >= 0 ? `${listId}-${active}` : undefined
          }
          aria-invalid={!!error}
          aria-describedby={error ? `${listId}-error` : undefined}
          required={required}
          disabled={disabled}
          className="min-h-11 pr-24"
          placeholder={`Cari atau pilih ${label.toLowerCase()}`}
          value={open ? query : currentLabel}
          onClick={() => {
            if (!open) {
              setOpen(true);
              setQuery("");
              onSearchChange("");
            }
          }}
          onChange={(event) => {
            setOpen(true);
            setActive(-1);
            setQuery(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape" && open) {
              event.preventDefault();
              event.stopPropagation();
              setOpen(false);
              return;
            }
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              if (!open) {
                setOpen(true);
                setQuery("");
                onSearchChange("");
              }
              setActive((previous) =>
                Math.max(
                  0,
                  Math.min(
                    options.length - 1,
                    previous + (event.key === "ArrowDown" ? 1 : -1),
                  ),
                ),
              );
            }
            if (event.key === "Enter" && open) {
              event.preventDefault();
              const option = canChoose ? options[active] : undefined;
              if (option) choose(String(option.id), option.name);
            }
          }}
        />
        <div className="absolute inset-y-0 right-0 flex items-center">
          {value && !required && (
            <button
              type="button"
              className="flex size-11 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              disabled={disabled}
              aria-label={`Kosongkan ${label}`}
              onClick={() => choose("", "")}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-md text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            disabled={disabled}
            aria-label={`Buka pilihan ${label}`}
            onClick={() => {
              input.current?.focus();
              setOpen(!open);
              if (!open) {
                setQuery("");
                onSearchChange("");
              }
            }}
          >
            <ChevronDown className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-0 rounded-md border bg-background p-1 shadow-md">
          <div
            id={listId}
            role="listbox"
            aria-label={`Pilihan ${label}`}
            aria-busy={pending}
            className="max-h-60 overflow-y-auto overscroll-contain"
          >
            {pending ? (
              <output className="block p-3 text-sm text-muted-foreground">
                Memuat pilihan…
              </output>
            ) : error ? (
              <p className="p-3 text-sm text-destructive">
                Pilihan tidak tersedia.
              </p>
            ) : options.length ? (
              options.map((option, index) => (
                <button
                  type="button"
                  tabIndex={-1}
                  key={option.id}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={String(option.id) === value}
                  className={`flex w-full text-left min-h-11 cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm break-words ${active === index ? "bg-accent text-accent-foreground" : "hover:bg-accent"}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(String(option.id), option.name)}
                >
                  <span className="min-w-0 flex-1">{option.name}</span>
                  {String(option.id) === value && (
                    <Check
                      className="size-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                  )}
                </button>
              ))
            ) : (
              <output className="block p-3 text-sm text-muted-foreground">
                Tidak ada pilihan yang cocok.
              </output>
            )}
          </div>
          {pages > 1 && onPageChange && (
            <div className="flex items-center justify-between gap-2 border-t p-1 text-xs">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={pending || page <= 1}
                onClick={() => {
                  setActive(-1);
                  onPageChange(page - 1);
                }}
              >
                Sebelumnya
              </Button>
              <span>
                {page}/{pages}
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={pending || page >= pages}
                onClick={() => {
                  setActive(-1);
                  onPageChange(page + 1);
                }}
              >
                Berikutnya
              </Button>
            </div>
          )}
        </div>
      )}
      {error && (
        <p
          id={`${listId}-error`}
          role="alert"
          className="mt-1 text-sm text-destructive"
        >
          {error}
        </p>
      )}
    </fieldset>
  );
}
