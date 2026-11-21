"use client";

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
import { ActionForm } from "@/features/modul/components/action-form";
import { assignCourierAction, cancelBookingAction } from "../pickup-actions";

type Courier = { id: number; name: string };

/**
 * Compact ✔ / ✖ like the provider's booking list. ✔ opens the courier
 * choice, ✖ asks for the cancel reason; both in a dialog, so the table row
 * stays small. The cancel dialog is also the confirmation.
 */
export function BookingRowActions({
  bookingId,
  bookingNo,
  courierId,
  couriers,
}: {
  bookingId: number;
  bookingNo: string;
  courierId: number | null;
  couriers: Courier[];
}) {
  const [open, setOpen] = useState<"assign" | "cancel" | null>(null);
  const close = () => setOpen(null);
  return (
    <div className="flex gap-2">
      <Button
        type="button"
        size="icon"
        className="size-11"
        aria-label={`Tugaskan kurir booking ${bookingNo}`}
        title="Tugaskan kurir"
        onClick={() => setOpen("assign")}
      >
        ✔
      </Button>
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="size-11 text-destructive"
        aria-label={`Batalkan booking ${bookingNo}`}
        title="Batalkan booking"
        onClick={() => setOpen("cancel")}
      >
        ✖
      </Button>

      <Dialog open={open === "assign"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tugaskan kurir</DialogTitle>
            <DialogDescription>
              Booking {bookingNo}. Kurir dari cabang booking yang akan menjemput
              dan scan barcode booking.
            </DialogDescription>
          </DialogHeader>
          <ActionForm
            action={assignCourierAction}
            onDone={close}
            submit={
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  onClick={close}
                >
                  Batal
                </Button>
                <Button type="submit" className="min-h-11">
                  Tugaskan
                </Button>
              </>
            }
          >
            <input type="hidden" name="bookingId" value={bookingId} />
            <div className="space-y-2">
              <Label htmlFor={`courier-${bookingId}`}>Kurir</Label>
              <select
                id={`courier-${bookingId}`}
                name="courierId"
                required
                defaultValue={courierId ?? ""}
                className="min-h-11 w-full rounded-md border bg-background px-2 text-sm"
              >
                <option value="">Pilih kurir…</option>
                {couriers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {couriers.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Belum ada kurir aktif di cabang ini (Master Data › Kurir).
                </p>
              )}
            </div>
          </ActionForm>
        </DialogContent>
      </Dialog>

      <Dialog open={open === "cancel"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batalkan booking {bookingNo}?</DialogTitle>
            <DialogDescription>
              Status menjadi CANCEL PICKUP dan tidak bisa dikembalikan.
            </DialogDescription>
          </DialogHeader>
          <ActionForm
            action={cancelBookingAction}
            onDone={close}
            submit={
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  onClick={close}
                >
                  Tidak
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  className="min-h-11"
                >
                  Ya, batalkan
                </Button>
              </>
            }
          >
            <input type="hidden" name="bookingId" value={bookingId} />
            <div className="space-y-2">
              <Label htmlFor={`reason-${bookingId}`}>Alasan batal</Label>
              <textarea
                id={`reason-${bookingId}`}
                name="reason"
                required
                minLength={3}
                maxLength={500}
                rows={3}
                className="w-full rounded-md border bg-background p-2 text-sm"
              />
            </div>
          </ActionForm>
        </DialogContent>
      </Dialog>
    </div>
  );
}
