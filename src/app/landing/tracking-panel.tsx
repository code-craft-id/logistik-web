"use client";

import { useState, type FormEvent } from "react";
import { ArrowUpRight, ScanLine } from "lucide-react";

const TRACKING_URL = "https://www.redlogistik.co.id/tracking";

const visuallyHiddenClass =
  "absolute h-px w-px overflow-hidden whitespace-nowrap [clip:rect(0,0,0,0)] [clip-path:inset(50%)]";

export default function TrackingPanel() {
  const [awb, setAwb] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = awb.trim();

    if (!value) {
      setMessage("Masukkan nomor AWB terlebih dahulu.");
      return;
    }

    const trackingWindow = window.open(TRACKING_URL, "_blank");
    if (trackingWindow) trackingWindow.opener = null;
    const nextStep = trackingWindow
      ? "Halaman tracking dibuka. "
      : "Popup diblokir. Buka halaman tracking melalui tautan di bawah. ";

    try {
      await navigator.clipboard.writeText(value);
      setMessage(`${nextStep}Nomor AWB disalin, lalu tempelkan pada kolom tracking.`);
    } catch {
      setMessage(
        `${nextStep}Salin nomor AWB dari kolom ini, lalu tempelkan pada halaman tracking.`,
      );
    }
  }

  return (
    <section
      className="border border-[var(--redlogistik-ink,#17231e)] bg-[var(--redlogistik-green,#0f5c4c)] p-[clamp(24px,3vw,38px)] text-white max-[760px]:px-[18px] max-[760px]:py-[22px]"
      aria-labelledby="tracking-title"
    >
      <div className="flex items-center justify-between border-b border-white/35 pb-4 text-[11px] font-bold tracking-[0.13em] text-[#e4f0e9]">
        <span>POS PELACAKAN</span>
        <ScanLine size={18} aria-hidden="true" />
      </div>
      <div className="py-6 pb-[18px]">
        <h2
          className="m-0 text-[clamp(28px,3vw,40px)] leading-[1.04] font-bold tracking-[-0.05em] max-[760px]:text-[32px]"
          id="tracking-title"
        >
          Lacak pengiriman.
        </h2>
        <p className="mt-3 max-w-[38ch] text-sm leading-[1.55] text-[#e0eee7]">
          Siapkan nomor AWB untuk melihat status kiriman di situs resmi RED Logistik.
        </p>
      </div>
      <form
        className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 max-[760px]:grid-cols-1"
        onSubmit={handleSubmit}
      >
        <label className={visuallyHiddenClass} htmlFor="redlogistik-awb">
          Nomor AWB
        </label>
        <input
          className="min-h-[52px] w-full min-w-0 rounded-none border border-[#b9ccc2] bg-white px-[14px] text-sm text-[var(--redlogistik-ink,#17231e)] placeholder:text-[#6b7770] focus-visible:outline-[3px] focus-visible:outline-white focus-visible:outline-offset-[3px]"
          autoComplete="off"
          id="redlogistik-awb"
          name="awb"
          onChange={(event) => {
            setAwb(event.currentTarget.value);
            setMessage("");
          }}
          placeholder="Masukkan nomor AWB"
          required
          spellCheck={false}
          value={awb}
        />
        <button
          className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-none border border-[var(--redlogistik-red,#b42332)] bg-[var(--redlogistik-red,#b42332)] px-[18px] text-sm font-bold text-white transition-colors hover:bg-[#aa2925] focus-visible:outline-[3px] focus-visible:outline-white focus-visible:outline-offset-[3px] motion-reduce:transition-none max-[760px]:justify-between"
          type="submit"
        >
          Lacak <ArrowUpRight size={17} aria-hidden="true" />
        </button>
      </form>
      <p className="mt-3 text-[11px] leading-[1.5] text-[#e0eee7]">
        Jika browser mengizinkan akses clipboard, nomor AWB akan disalin otomatis.
      </p>
      <p className="mt-[7px] min-h-[34px] text-[11px] leading-[1.5] text-[#e0eee7]" aria-live="polite">
        {message || (
          <span className="text-[#bdd1c6]">Status tindakan akan muncul di sini.</span>
        )}
      </p>
      <a
        className="inline-flex w-full items-center justify-end gap-[9px] text-xs font-bold text-white transition-colors hover:text-[#ffe2df] motion-reduce:transition-none"
        href={TRACKING_URL}
        target="_blank"
        rel="noreferrer"
      >
        Buka halaman tracking <ArrowUpRight size={15} aria-hidden="true" />
      </a>
    </section>
  );
}
