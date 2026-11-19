"use client";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useRef, useState } from "react";
import { useConfirm } from "@/components/patterns/confirm-dialog";
import { Button } from "@/components/ui/button";
import { financeCommand } from "../actions";

export function CommandForm({
  values,
  children,
  label,
  href,
}: {
  values: Record<string, unknown>;
  children?: ReactNode;
  label: string;
  href?: string;
}) {
  const router = useRouter();
  const token = useRef<string | null>(null);
  const lastPayload = useRef("");
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const destructive = [
    "invoice.void",
    "payment.reverse",
    "journal.reverse",
    "finance_cost.reverse",
    "finance_period.close",
  ].includes(String(values.action));
  const { confirm, dialog } = useConfirm();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy.current) return;
    const form = e.currentTarget;
    // Void, reverse and period close cannot be undone from the screen.
    if (
      destructive &&
      !(await confirm({
        title: `${label}?`,
        description:
          "Tindakan ini dicatat permanen dan tidak bisa dibatalkan dari layar (koreksi lewat jurnal balik).",
        confirmLabel: `Ya, ${label.toLowerCase()}`,
      }))
    )
      return;
    const payload = {
      ...values,
      ...Object.fromEntries(new FormData(form)),
    };
    const serialized = JSON.stringify(payload);
    if (serialized !== lastPayload.current) token.current = null;
    token.current ??= crypto.randomUUID();
    lastPayload.current = serialized;
    const data = { ...payload, key: token.current };
    busy.current = true;
    setPending(true);
    setMessage("");
    setFailed(false);
    try {
      const result = await financeCommand(data);
      if (!result.ok) {
        setFailed(true);
        setMessage(result.message);
        return;
      }
      token.current = null;
      setMessage("Tersimpan.");
      if (href) router.push(href.replace(":id", String(result.id)));
      router.refresh();
    } catch {
      setFailed(true);
      setMessage(
        "Hasil belum dapat dikonfirmasi. Coba kembali dengan isi yang sama.",
      );
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return (
    <form
      noValidate
      onSubmit={submit}
      className="min-w-0 space-y-4"
      aria-busy={pending}
      onChange={() => {
        if (!busy.current) token.current = null;
      }}
    >
      {dialog}
      <fieldset
        disabled={pending}
        className="min-w-0 space-y-4 disabled:opacity-70"
      >
        {children}
        <Button
          className="min-h-11 h-auto max-w-full whitespace-normal text-left"
          variant={destructive ? "destructive" : "default"}
          type="submit"
        >
          {pending ? "Menyimpan…" : label}
        </Button>
      </fieldset>
      <div
        role={failed ? "alert" : "status"}
        aria-atomic="true"
        className={
          message
            ? `rounded-md border p-3 text-sm break-words ${failed ? "border-destructive text-destructive" : "border-border bg-muted"}`
            : "sr-only"
        }
      >
        {message}
      </div>
    </form>
  );
}
