"use client";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useRef, useState } from "react";
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
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy.current) return;
    const payload = {
      ...values,
      ...Object.fromEntries(new FormData(e.currentTarget)),
    };
    const serialized = JSON.stringify(payload);
    if (serialized !== lastPayload.current) token.current = null;
    token.current ??= crypto.randomUUID();
    lastPayload.current = serialized;
    const data = { ...payload, key: token.current };
    busy.current = true;
    setPending(true);
    setMessage("");
    try {
      const result = await financeCommand(data);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      token.current = null;
      setMessage("Tersimpan.");
      if (href) router.push(href.replace(":id", String(result.id)));
      router.refresh();
    } catch {
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
      className="space-y-4"
      onChange={() => {
        if (!busy.current) token.current = null;
      }}
    >
      <fieldset disabled={pending} className="space-y-4">
        {children}
        <Button className="min-h-11" type="submit">
          {pending ? "Menyimpan…" : label}
        </Button>
      </fieldset>
      <output className="block text-sm">{message}</output>
    </form>
  );
}
