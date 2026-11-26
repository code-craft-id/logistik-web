"use client";
import { Tabs } from "radix-ui";
import { useCallback, useEffect, useState } from "react";
import { LoadingState } from "@/components/patterns/content-state";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getWhatsAppNotificationSettings,
  listWhatsAppActiveCustomers,
  saveWhatsAppTemplate,
} from "@/features/whatsapp/actions";
import type { WhatsAppNotificationSettings } from "@/features/whatsapp/server/template-service";
import {
  WHATSAPP_TEMPLATE_INFO,
  type WhatsAppKind,
} from "@/features/whatsapp/templates";

const TABS = [
  { id: "transaction", kinds: ["TRX_SENDER", "TRX_RECEIVER"] },
  { id: "status", kinds: ["SHIPMENT_STATUS"] },
  { id: "delivery", kinds: ["DELIVERY_SHEET"] },
] as const satisfies readonly { id: string; kinds: readonly WhatsAppKind[] }[];

/**
 * Provider Perusahaan > WA Notifikasi (OBSERVED, D-37): the list of
 * customers with WA Notif active and the "Pesan Whatsapp" dialog with four
 * editable messages, each with a fixed recipient and an on/off status.
 */
export function WhatsAppMessagePreview() {
  return (
    <div className="space-y-6">
      <ActiveCustomers />
      <WhatsAppMessages />
    </div>
  );
}

function ActiveCustomers() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error"; message: string }
    | {
        status: "ready";
        items: { id: number; name: string }[];
        total: number;
        totalPages: number;
        pageSize: number;
      }
  >({ status: "loading" });
  useEffect(() => {
    let live = true;
    const timer = setTimeout(async () => {
      const result = await listWhatsAppActiveCustomers({ page, search });
      if (!live) return;
      setState(
        result.ok
          ? { status: "ready", ...result.data }
          : { status: "error", message: result.message },
      );
    }, 250);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [page, search]);
  return (
    <section className="space-y-3" aria-labelledby="wa-active-customers">
      <h2 id="wa-active-customers" className="text-lg font-semibold">
        List Customer Aktif WA Notifikasi
      </h2>
      <p className="text-sm text-muted-foreground">
        Pesan otomatis hanya dikirim untuk AWB milik customer di daftar ini.
        Aktifkan lewat Pemasaran &gt; Customer, kolom WA Notif.
      </p>
      <div className="max-w-sm space-y-1">
        <Label htmlFor="wa-customer-search">Cari</Label>
        <Input
          id="wa-customer-search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>
      {state.status === "loading" && <output>Memuat…</output>}
      {state.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
      {state.status === "ready" && (
        <>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="w-16 px-3 py-2">No.</th>
                  <th className="px-3 py-2">Customer Name</th>
                </tr>
              </thead>
              <tbody>
                {state.items.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-3 py-4 text-muted-foreground">
                      Belum ada customer dengan WA Notif aktif.
                    </td>
                  </tr>
                )}
                {state.items.map((item, index) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-3 py-2">
                      {(page - 1) * state.pageSize + index + 1}
                    </td>
                    <td className="px-3 py-2">{item.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span>
              {state.total} customer · halaman {page} dari {state.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="min-h-11"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                className="min-h-11"
                disabled={page >= state.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function WhatsAppMessages() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<WhatsAppNotificationSettings | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    const result = await getWhatsAppNotificationSettings();
    if (result.ok) {
      setSettings(result.data);
      setError(null);
    } else setError(result.message);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <section className="space-y-3" aria-labelledby="wa-messages">
      <h2 id="wa-messages" className="text-lg font-semibold">
        Pesan Whatsapp
      </h2>
      <Button className="min-h-11" onClick={() => setOpen(true)}>
        Lihat Pesan Whatsapp
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {settings && (
        <p className="text-sm text-muted-foreground">
          7 hari terakhir: {settings.recent.SENT} terkirim ke antrean,{" "}
          {settings.recent.PENDING} menunggu, {settings.recent.SKIPPED} dilewati
          (tanpa nomor/nonaktif), {settings.recent.FAILED} gagal. Pesan dikirim
          berjeda ±10 detik per nomor cabang.
        </p>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-dvh overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Pesan Whatsapp</DialogTitle>
            <DialogDescription>
              Ubah isi pesan dan status kirimnya. Variabel dalam kurung kurawal
              diisi otomatis dari AWB.
            </DialogDescription>
          </DialogHeader>
          {!settings && !error && <LoadingState label="Memuat…" />}
          {settings && (
            <Tabs.Root defaultValue="transaction">
              <Tabs.List
                aria-label="Jenis pesan WhatsApp"
                className="flex flex-wrap gap-2 border-b"
              >
                {TABS.map((tab) => (
                  <Tabs.Trigger
                    key={tab.id}
                    value={tab.id}
                    className="min-h-11 border-b-2 border-transparent px-3 py-2 text-sm data-[state=active]:border-primary data-[state=active]:text-primary"
                  >
                    {WHATSAPP_TEMPLATE_INFO[tab.kinds[0]].tab}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
              {TABS.map((tab) => (
                <Tabs.Content key={tab.id} value={tab.id} className="py-5">
                  <div className="grid gap-6 md:grid-cols-2">
                    {tab.kinds.map((kind) => {
                      const current = settings.templates.find(
                        (t) => t.kind === kind,
                      );
                      return current ? (
                        <TemplateForm
                          key={`${kind}:${current.message}:${current.isEnabled}`}
                          kind={kind}
                          message={current.message}
                          isEnabled={current.isEnabled}
                          canEdit={settings.canEdit}
                          onSaved={load}
                        />
                      ) : null;
                    })}
                  </div>
                </Tabs.Content>
              ))}
            </Tabs.Root>
          )}
          <div className="flex justify-end">
            <Button
              variant="outline"
              className="min-h-11"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function TemplateForm({
  kind,
  message: initialMessage,
  isEnabled: initialEnabled,
  canEdit,
  onSaved,
}: {
  kind: WhatsAppKind;
  message: string;
  isEnabled: boolean;
  canEdit: boolean;
  onSaved: () => Promise<void>;
}) {
  const info = WHATSAPP_TEMPLATE_INFO[kind];
  const [message, setMessage] = useState(initialMessage);
  const [isEnabled, setEnabled] = useState(initialEnabled);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const id = `wa-${kind.toLowerCase()}`;
  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setNotice(null);
        const result = await saveWhatsAppTemplate({ kind, message, isEnabled });
        setPending(false);
        if (result.ok) {
          setNotice({ ok: true, text: "Tersimpan." });
          await onSaved();
        } else setNotice({ ok: false, text: result.message });
      }}
    >
      <div className="space-y-1">
        <Label htmlFor={`${id}-recipient`}>
          Penerima WA Notif {info.tab.replace("Message WA ", "")}
        </Label>
        <Input
          id={`${id}-recipient`}
          value={info.recipientLabel}
          readOnly
          className="bg-muted"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${id}-message`}>{info.title}</Label>
        <Textarea
          id={`${id}-message`}
          className="min-h-44"
          value={message}
          maxLength={2000}
          readOnly={!canEdit}
          onChange={(e) => setMessage(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          note : {info.variables.map((v) => `{${v}}`).join(",")} berasal dari
          AWB yang diupdate. Dikirim: {info.trigger}
        </p>
      </div>
      <div className="flex min-h-11 items-center gap-2">
        <Checkbox
          id={`${id}-status`}
          checked={isEnabled}
          disabled={!canEdit}
          onCheckedChange={(v) => setEnabled(v === true)}
        />
        <Label htmlFor={`${id}-status`}>
          Status {isEnabled ? "on" : "off"}
        </Label>
      </div>
      {canEdit && (
        <Button
          type="submit"
          className="min-h-11"
          disabled={pending || !message.trim()}
        >
          {pending ? "Menyimpan…" : "Submit"}
        </Button>
      )}
      {notice && (
        <p
          role={notice.ok ? "status" : "alert"}
          className={
            notice.ok
              ? "text-sm text-muted-foreground"
              : "text-sm text-destructive"
          }
        >
          {notice.text}
        </p>
      )}
    </form>
  );
}
