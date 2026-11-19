import Link from "next/link";
import {
  type AccessActor,
  permits,
  permitsBranch,
} from "@/features/identity/permissions";
import { cloudinaryConfigured } from "@/lib/cloudinary";
import { prisma } from "@/lib/db";
import { deliveryProofs } from "../server/manifests-queries";
import { DeliveryPhotoForm } from "./delivery-photo-form";

const OUTCOME: Record<string, string> = {
  DELIVERED: "Terkirim",
  FAILED_DELIVERY: "Gagal",
  RETURNED: "Retur",
};
const time = (d: Date | null) =>
  d ? d.toISOString().slice(0, 16).replace("T", " ") : "-";

/** Bukti Terima (POD) on the AWB detail page: outcome and optional photo. */
export async function DeliveryProof({
  actor,
  transactionId,
}: {
  actor: AccessActor;
  transactionId: number;
}) {
  const [proofs, scans] = await Promise.all([
    deliveryProofs(transactionId),
    prisma.deliveryProof.findMany({
      where: { transactionId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        outcome: true,
        receiverName: true,
        notes: true,
        createdAt: true,
        signatureUrl: true,
        createdBy: { select: { name: true } },
        photos: {
          where: { deletedAt: null },
          orderBy: { position: "asc" },
          select: { position: true, url: true },
        },
      },
    }),
  ]);
  const canUpdate = permits(actor, "update", "delivery");
  const enabled = cloudinaryConfigured();
  return (
    <section
      aria-labelledby="pod-proof"
      className="space-y-3 rounded-lg border bg-background p-4"
    >
      <h2 id="pod-proof" className="font-medium">
        Bukti Terima (POD)
      </h2>
      {scans.map((scan) => (
        <div key={`scan-${scan.id}`} className="space-y-2 border-b pb-3">
          <p className="text-sm">
            <span className="font-semibold">
              {scan.outcome === "DELIVERED" ? "DITERIMA" : "RETUR"}
            </span>
            {scan.receiverName ? ` oleh ${scan.receiverName}` : ""} ·{" "}
            {time(scan.createdAt)}
            {scan.createdBy ? ` · dicatat ${scan.createdBy.name}` : ""}
            {scan.notes ? ` · ${scan.notes}` : ""}
          </p>
          {(scan.photos.length > 0 || scan.signatureUrl) && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {[
                ...scan.photos.map((p) => ({
                  key: `p${p.position}`,
                  url: p.url,
                  alt: `Foto penerima ${p.position}`,
                })),
                ...(scan.signatureUrl
                  ? [
                      {
                        key: "sig",
                        url: scan.signatureUrl,
                        alt: "Tanda tangan penerima",
                      },
                    ]
                  : []),
              ].map((img) => (
                <a
                  key={img.key}
                  href={img.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {/* biome-ignore lint/performance/noImgElement: Cloudinary thumbnail */}
                  <img
                    src={img.url.replace(
                      "/image/upload/",
                      "/image/upload/c_pad,w_200,h_200,b_white,f_webp,q_auto/",
                    )}
                    alt={img.alt}
                    loading="lazy"
                    className="aspect-square w-full rounded-md border bg-white object-contain"
                  />
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
      {proofs.length === 0 && scans.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Belum ada bukti terima. Catat lewat Scan AWB (Update Status), atau
          lewat DRS di detail manifest lalu unggah foto di sini.
        </p>
      ) : (
        proofs.map((p) => {
          const manifest = p.deliverySheet.manifest;
          const canUpload =
            canUpdate &&
            !p.podPhotoUrl &&
            !!p.outcome &&
            !!manifest.branchId &&
            permitsBranch(actor, manifest.branchId);
          return (
            <div
              key={p.deliverySheetId}
              className="grid gap-4 border-t pt-3 first:border-t-0 first:pt-0 md:grid-cols-[1fr_auto]"
            >
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                {(
                  [
                    ["DRS", p.deliverySheet.sheetNo],
                    [
                      "Hasil antar",
                      p.outcome
                        ? (OUTCOME[p.outcome] ?? p.outcome)
                        : "Belum dicatat",
                    ],
                    ["Diterima oleh", p.receivedBy],
                    ["Waktu terkirim", time(p.deliveredAt)],
                    ["Catatan", p.notes],
                    [
                      "Foto diunggah",
                      p.podPhotoUrl ? time(p.podPhotoAt) : null,
                    ],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium [overflow-wrap:anywhere]">
                      {value ?? "-"}
                    </dd>
                  </div>
                ))}
                <div className="col-span-full">
                  <Link
                    href={`/manifest/${manifest.id}`}
                    className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
                  >
                    Buka manifest {manifest.manifestNo}
                  </Link>
                </div>
              </dl>
              <div className="min-w-0 md:w-72">
                {p.podPhotoUrl ? (
                  <a
                    href={p.podPhotoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    {/* biome-ignore lint/performance/noImgElement: external Cloudinary image */}
                    <img
                      src={p.podPhotoUrl.replace(
                        "/image/upload/",
                        "/image/upload/c_limit,w_600,f_webp,q_auto/",
                      )}
                      alt="Foto bukti terima"
                      loading="lazy"
                      className="max-h-72 w-full rounded-md border object-contain"
                    />
                    <span className="mt-1 block text-xs text-primary underline">
                      Lihat ukuran penuh
                    </span>
                  </a>
                ) : canUpload ? (
                  enabled ? (
                    <DeliveryPhotoForm
                      manifestId={manifest.id}
                      deliverySheetId={p.deliverySheetId}
                      transactionId={transactionId}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Upload foto belum diaktifkan. Admin perlu mengisi
                      CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY dan
                      CLOUDINARY_API_SECRET di .env.
                    </p>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {p.outcome
                      ? "Belum ada foto bukti terima."
                      : "Catat hasil antar di manifest dulu, lalu foto bisa diunggah."}
                  </p>
                )}
              </div>
            </div>
          );
        })
      )}
    </section>
  );
}
