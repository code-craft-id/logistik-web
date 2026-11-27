"use client";

import { Headset, Send, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type ChatMessage,
  freshMessages,
  HISTORY_TTL_MS,
  searchHelp,
} from "../search";

const STORAGE_KEY = "lms-help-chat";
const SUGGESTIONS = [
  "Cara entry AWB",
  "Buat manifest",
  "Catat hasil antar",
  "Laporan omset",
];

function load(): ChatMessage[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? freshMessages(JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}
function save(messages: ChatMessage[]) {
  try {
    if (messages.length)
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable (private mode): the chat still works in memory.
  }
}
/** AI answer, or null when AI is off or failing. */
async function askAi(question: string): Promise<string | null> {
  try {
    const response = await fetch("/api/help", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    return response.ok ? ((await response.json()).answer ?? null) : null;
  } catch {
    return null;
  }
}
const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/** Floating feature-help chat: AI answer, else the local knowledge file. */
export function HelpChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLOListElement>(null);

  useEffect(() => {
    setMessages(load());
    // Expire history older than ten minutes while the page stays open.
    const timer = window.setInterval(
      () => setMessages((current) => freshMessages(current)),
      60_000,
    );
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => save(messages), [messages]);
  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);
  const count = messages.length;
  useEffect(() => {
    if (open && count)
      list.current?.lastElementChild?.scrollIntoView({ block: "end" });
  }, [open, count]);

  async function ask(question: string) {
    const text = question.trim().slice(0, 300);
    if (!text || busy.current) return;
    busy.current = true;
    setPending(true);
    setDraft("");
    const asked = Date.now();
    setMessages((current) => [
      ...freshMessages(current, asked),
      { id: newId(), role: "user", text, at: asked },
    ]);
    const ai = await askAi(text);
    const now = Date.now();
    const matches = searchHelp(text);
    const local: ChatMessage = matches.length
      ? {
          id: newId(),
          role: "assistant",
          at: now,
          text: `${matches[0].title}\n${matches[0].answer}${
            matches.length > 1
              ? `\n\nTopik terkait: ${matches
                  .slice(1)
                  .map((m) => m.title)
                  .join(", ")}.`
              : ""
          }`,
          href: matches[0].href,
        }
      : {
          id: newId(),
          role: "assistant",
          at: now,
          text: "Maaf, saya belum menemukan penjelasannya. Coba kata lain, misalnya: AWB, manifest, DRS, invoice, laporan, customer, hak akses.",
        };
    const reply: ChatMessage = ai
      ? { id: newId(), role: "assistant", at: now, text: ai }
      : local;
    setMessages((current) => [...freshMessages(current, now), reply]);
    busy.current = false;
    setPending(false);
  }

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3 print:hidden">
      {open && (
        <section
          id="help-chat-panel"
          aria-label="Bantuan fitur"
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
          className="flex h-[min(30rem,calc(100dvh-6rem))] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border bg-background shadow-lg"
        >
          <header className="flex items-center justify-between gap-2 border-b px-4 py-2">
            <div>
              <h2 className="text-sm font-semibold">Bantuan fitur</h2>
              <p className="text-xs text-muted-foreground">
                Riwayat terhapus otomatis setelah {HISTORY_TTL_MS / 60_000}{" "}
                menit
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Tutup bantuan"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </header>
          <ol
            ref={list}
            aria-live="polite"
            className="flex-1 space-y-3 overflow-y-auto p-4 text-sm"
          >
            {messages.length === 0 && (
              <li className="space-y-2 text-muted-foreground">
                <p>
                  Tanyakan cara memakai fitur LMS (jangan tulis data pribadi).
                  Contoh pertanyaan:
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => ask(s)}
                      className="min-h-9 rounded-full border px-3 text-xs text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </li>
            )}
            {messages.map((m) => (
              <li
                key={m.id}
                className={
                  m.role === "user"
                    ? "ml-8 rounded-lg bg-primary px-3 py-2 text-primary-foreground"
                    : "mr-4 whitespace-pre-line rounded-lg bg-muted px-3 py-2"
                }
              >
                <span className="sr-only">
                  {m.role === "user" ? "Anda: " : "Bantuan: "}
                </span>
                {m.text}
                {m.href && (
                  <Link
                    href={m.href}
                    className="mt-1 block text-primary underline underline-offset-4"
                  >
                    Buka halaman
                  </Link>
                )}
              </li>
            ))}
            {pending && (
              <li className="mr-4 rounded-lg bg-muted px-3 py-2 text-muted-foreground">
                Mengetik…
              </li>
            )}
          </ol>
          <form
            className="flex gap-2 border-t p-3"
            onSubmit={(event) => {
              event.preventDefault();
              ask(draft);
            }}
          >
            <Input
              ref={input}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={300}
              placeholder="Tulis pertanyaan…"
              aria-label="Pertanyaan"
              className="min-h-10"
            />
            <Button
              type="submit"
              size="icon"
              aria-label="Kirim"
              disabled={pending}
              className="min-h-10 min-w-10"
            >
              <Send className="size-4" aria-hidden="true" />
            </Button>
          </form>
        </section>
      )}
      <Button
        type="button"
        size="icon"
        aria-label={open ? "Tutup bantuan fitur" : "Buka bantuan fitur"}
        aria-expanded={open}
        aria-controls="help-chat-panel"
        onClick={() => setOpen((v) => !v)}
        className="size-12 rounded-full shadow-lg"
      >
        {open ? (
          <X className="size-5" aria-hidden="true" />
        ) : (
          <Headset className="size-5" aria-hidden="true" />
        )}
      </Button>
    </div>
  );
}
