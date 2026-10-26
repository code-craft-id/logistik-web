"use client";
import { Tabs } from "radix-ui";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const tabs = [
  {
    id: "transaction",
    label: "Message WA Transaksi",
    panels: ["Pengirim transaksi", "Penerima transaksi"],
  },
  { id: "status", label: "Message WA Shipment Status", panels: ["Pengirim"] },
  { id: "delivery", label: "Message WA Delivery Sheet", panels: ["Penerima"] },
];
export function WhatsAppMessagePreview() {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Pesan WhatsApp</h2>
      <Button className="min-h-11" onClick={() => setOpen(true)}>
        Lihat Pesan WhatsApp
      </Button>
      <p className="text-sm text-muted-foreground">
        Pratinjau struktur pesan. Penyimpanan template dan pengiriman belum
        diaktifkan.
      </p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-dvh overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Pesan WhatsApp</DialogTitle>
            <DialogDescription>
              Contoh tampilan saja. Teks ini tidak tersimpan dan tidak mengirim
              pesan.
            </DialogDescription>
          </DialogHeader>
          <Tabs.Root defaultValue="transaction">
            <Tabs.List
              aria-label="Jenis pesan WhatsApp"
              className="flex flex-wrap gap-2 border-b"
            >
              {tabs.map((tab) => (
                <Tabs.Trigger
                  key={tab.id}
                  value={tab.id}
                  className="min-h-11 border-b-2 border-transparent px-3 py-2 text-sm data-[state=active]:border-primary data-[state=active]:text-primary"
                >
                  {tab.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            {tabs.map((tab) => (
              <Tabs.Content key={tab.id} value={tab.id} className="py-5">
                <div className="grid gap-5 md:grid-cols-2">
                  {tab.panels.map((panel, index) => (
                    <div className="space-y-3" key={panel}>
                      <h3 className="font-medium">{panel}</h3>
                      <Label htmlFor={`${tab.id}-${index}`}>Format pesan</Label>
                      <Textarea
                        id={`${tab.id}-${index}`}
                        readOnly
                        className="min-h-36 bg-muted"
                        value={`Halo {nama}, informasi pengiriman {awb}: {status}. Terima kasih.`}
                      />
                      <p className="text-xs text-muted-foreground">
                        Placeholder contoh: {"{nama}, {awb}, {status}"}.
                      </p>
                    </div>
                  ))}
                </div>
              </Tabs.Content>
            ))}
          </Tabs.Root>
          <div className="flex justify-end">
            <Button className="min-h-11" onClick={() => setOpen(false)}>
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
