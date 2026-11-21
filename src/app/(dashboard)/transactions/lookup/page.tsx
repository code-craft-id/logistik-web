import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { redirect } from "next/navigation";
import { InfoTip } from "@/components/patterns/info-tip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { currentIdentity } from "@/features/identity/server/context";
import {
  searchTracking,
  trackingDetail,
} from "@/features/shipments/server/tracking";
import { requirePagePermission } from "@/lib/auth/page-access";

export const metadata: Metadata = { title: "Tracking AWB" };

// Query- and session-dependent; blocking render.
export const instant = false;

const one = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v)?.slice(0, 60) ?? "";
const when = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Jakarta",
      })
    : null;

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-2 border-b py-2 text-sm last:border-b-0 sm:grid-cols-[11rem_1fr]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 font-medium [overflow-wrap:anywhere]">
        {value === null || value === undefined || value === "" ? "-" : value}
      </dd>
    </div>
  );
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePagePermission("view", "transaction");
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const params = await searchParams;
  const awb = one(params.awb);
  const doNo = one(params.do);
  const id = Number(one(params.id));

  const matches =
    !id && (awb || doNo)
      ? await searchTracking(current.actor, { awb, doNo })
      : [];
  const pickedId = id || (matches.length === 1 ? matches[0].id : 0);
  const detail = pickedId
    ? await trackingDetail(current.actor, pickedId)
    : null;

  return (
    <div className="min-w-0 space-y-5">
      <header className="flex items-center gap-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Tracking AWB
        </h1>
        <InfoTip text="Cari dengan No. AWB (label koli AWB-n juga bisa) atau No. DO. Hanya AWB dari/ke cabang Anda yang tampil." />
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        <Form action="/transactions/lookup" className="flex gap-2">
          <Input
            name="awb"
            defaultValue={awb}
            placeholder="Search AWB"
            aria-label="Cari No. AWB"
            className="min-h-11"
          />
          <Button type="submit" className="min-h-11">
            Cari
          </Button>
        </Form>
        <Form action="/transactions/lookup" className="flex gap-2">
          <Input
            name="do"
            defaultValue={doNo}
            placeholder="Search DO"
            aria-label="Cari No. DO"
            className="min-h-11"
          />
          <Button type="submit" className="min-h-11">
            Cari
          </Button>
        </Form>
      </div>

      {!id && (awb || doNo) && matches.length === 0 && (
        <p role="alert" className="rounded-md border p-3 text-sm">
          AWB tidak ditemukan atau bukan dari/ke cabang Anda.
        </p>
      )}

      {matches.length > 1 && (
        <section aria-label="Hasil pencarian" className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {matches.length >= 50
              ? "50 hasil terbaru; perjelas pencarian bila AWB belum terlihat."
              : `${matches.length} AWB ditemukan. Pilih salah satu:`}
          </p>
          <ul className="divide-y rounded-lg border bg-background">
            {matches.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/transactions/lookup?id=${m.id}`}
                  className="flex min-h-11 flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 text-sm hover:bg-muted"
                >
                  <span className="font-mono font-medium">{m.awbNo}</span>
                  <span>{m.date}</span>
                  <span>
                    {m.origin ?? "-"} → {m.destination ?? "-"}
                  </span>
                  <span className="text-muted-foreground">
                    DO {m.doNo || "-"}
                  </span>
                  <span className="rounded-full border px-2 text-xs">
                    {m.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {id > 0 && !detail && (
        <p role="alert" className="rounded-md border p-3 text-sm">
          AWB tidak ditemukan atau bukan dari/ke cabang Anda.
        </p>
      )}

      {detail && (
        <section
          aria-label={`Status pengiriman ${detail.awbNo}`}
          className="space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Status Pengiriman</h2>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full border px-3 py-1">
                {detail.status}
              </span>
              <Link
                href={`/transactions/${detail.id}`}
                className="text-primary underline underline-offset-4"
              >
                Buka detail AWB
              </Link>
            </div>
          </div>
          <div className="grid gap-4 rounded-lg border bg-background p-4 lg:grid-cols-2">
            <dl>
              <Row
                label="AWB No."
                value={<span className="font-mono">{detail.awbNo}</span>}
              />
              <Row label="DO No." value={detail.sender.doNo} />
              <Row label="Nama Pengirim" value={detail.sender.name} />
              <Row label="Asal" value={detail.sender.origin} />
              <Row label="Alamat Pengirim" value={detail.sender.address} />
              <Row label="Layanan" value={detail.service} />
              <Row label="Koli" value={detail.goods.koli} />
              <Row label="No Manifest" value={detail.manifestNo} />
              <Row label="DRS No." value={detail.drsNo} />
              <Row label="No. Invoice" value={detail.invoiceNo} />
              <Row label="Tanggal Diterima" value={when(detail.receivedAt)} />
              <Row
                label="Lead Time"
                value={
                  detail.leadTimeDays === null
                    ? null
                    : `${detail.leadTimeDays} hari`
                }
              />
            </dl>
            <dl>
              <Row label="Tanggal Input AWB" value={when(detail.inputAt)} />
              <Row label="Nama Penerima" value={detail.receiver.name} />
              <Row label="Tujuan" value={detail.receiver.destination} />
              <Row label="Alamat Penerima" value={detail.receiver.address} />
              <Row label="Moda" value={detail.moda} />
              <Row label="Kilo" value={detail.goods.kilo} />
              <Row
                label="Driver"
                value={
                  [detail.driver, detail.vehicle].filter(Boolean).join(" · ") ||
                  null
                }
              />
              <Row label="Diterima Oleh" value={detail.receivedBy} />
              <Row label="Catatan AWB" value={detail.remarks} />
            </dl>
          </div>
          {detail.photos.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {detail.photos.map((url, index) => (
                <figure key={url} className="space-y-1">
                  {/* biome-ignore lint/performance/noImgElement: Cloudinary URLs, already sized WebP */}
                  <img
                    src={url}
                    alt={`Foto penerima ${index + 1}`}
                    loading="lazy"
                    className="max-h-80 w-full rounded-md border object-contain"
                  />
                  <figcaption className="text-xs text-muted-foreground">
                    {index === 0 ? "Foto" : "Foto II"}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
          <section
            aria-label="Riwayat"
            className="rounded-lg border bg-background p-4"
          >
            <h3 className="mb-2 font-medium">Tracking Details</h3>
            {detail.tracking.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada riwayat.
              </p>
            ) : (
              <ol className="space-y-2 text-sm">
                {detail.tracking.map((event) => (
                  <li
                    key={`${event.at}-${event.text}`}
                    className="grid gap-1 sm:grid-cols-[11rem_1fr]"
                  >
                    <span className="text-muted-foreground tabular-nums">
                      {when(event.at)}
                    </span>
                    <span>{event.text}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </section>
      )}
    </div>
  );
}
