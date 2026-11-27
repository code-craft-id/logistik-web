"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * White signature box: draw with a finger, pen or mouse; "Simpan" returns a
 * PNG. Strokes use pointer events so touch and mouse behave the same.
 */
export function SignaturePad({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (png: Blob) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);

  // Size the canvas to its box and the screen density each time it opens.
  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => {
      const el = canvas.current;
      if (!el) return;
      const ratio = window.devicePixelRatio || 1;
      const { width, height } = el.getBoundingClientRect();
      el.width = Math.round(width * ratio);
      el.height = Math.round(height * ratio);
      const ctx = el.getContext("2d");
      if (!ctx) return;
      ctx.scale(ratio, ratio);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#111111";
      setEmpty(true);
    });
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  const clear = () => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const { width, height } = el.getBoundingClientRect();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    setEmpty(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tanda tangan penerima</DialogTitle>
          <DialogDescription>
            Minta penerima menggores tanda tangan di kotak putih.
          </DialogDescription>
        </DialogHeader>
        <canvas
          ref={canvas}
          aria-label="Kotak tanda tangan"
          className="h-56 w-full touch-none rounded-md border-2 border-dashed bg-white"
          onPointerDown={(event) => {
            const ctx = canvas.current?.getContext("2d");
            if (!ctx) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            drawing.current = true;
            const { x, y } = point(event);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + 0.1, y + 0.1);
            ctx.stroke();
            setEmpty(false);
          }}
          onPointerMove={(event) => {
            if (!drawing.current) return;
            const ctx = canvas.current?.getContext("2d");
            if (!ctx) return;
            const { x, y } = point(event);
            ctx.lineTo(x, y);
            ctx.stroke();
          }}
          onPointerUp={() => {
            drawing.current = false;
          }}
          onPointerCancel={() => {
            drawing.current = false;
          }}
        />
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={clear}
          >
            Hapus
          </Button>
          <Button
            type="button"
            className="min-h-11"
            disabled={empty}
            onClick={() =>
              canvas.current?.toBlob((blob) => {
                if (blob) {
                  onSave(blob);
                  onOpenChange(false);
                }
              }, "image/png")
            }
          >
            Simpan tanda tangan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
