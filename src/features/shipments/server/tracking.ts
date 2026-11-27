import "server-only";

import type { AccessActor } from "@/features/identity/permissions";
import { assertPermission } from "@/features/identity/server/access";
import { transactionScope } from "@/features/modul/server/common";
import { awbForScan, type ScanAwbView } from "@/features/modul/server/proof";
import { businessDateString } from "@/lib/date/business-date";
import { prisma } from "@/lib/db";

export type TrackingMatch = {
  id: number;
  awbNo: string;
  doNo: string | null;
  date: string;
  origin: string | null;
  destination: string | null;
  status: string;
};

export type TrackingDetail = ScanAwbView & {
  inputAt: string;
  service: string | null;
  moda: string | null;
  manifestNo: string | null;
  driver: string | null;
  vehicle: string | null;
  drsNo: string | null;
  invoiceNo: string | null;
  receivedAt: string | null;
  receivedBy: string | null;
  /** Whole days from the AWB date to receipt (provider "Lead Time"). */
  leadTimeDays: number | null;
  remarks: string | null;
  /** First two receipt photos (provider Foto / Foto II). */
  photos: string[];
};

const clean = (value: string | undefined) =>
  (value ?? "").replace(/\s+/g, " ").trim().slice(0, 60);

/**
 * Tracking AWB as in the provider: search by AWB No. or by DO No. (a DO
 * field may hold several numbers), within the actor's branches.
 */
export async function searchTracking(
  actor: AccessActor,
  query: { awb?: string; doNo?: string },
): Promise<TrackingMatch[]> {
  assertPermission(actor, "view", "transaction");
  const awb = clean(query.awb).replace(/\s/g, "");
  const doNo = clean(query.doNo);
  if (!awb && !doNo) return [];
  // A koli label "AWB-n" finds its AWB too.
  const koli = /^(.+)-(\d{1,3})$/.exec(awb);
  const rows = await prisma.transaction.findMany({
    where: {
      deletedAt: null,
      // AND keeps the branch scope and the number match as separate ORs.
      AND: [
        transactionScope(actor),
        awb
          ? {
              OR: [
                { awbNo: { equals: awb, mode: "insensitive" } },
                ...(koli
                  ? [
                      {
                        awbNo: {
                          equals: koli[1],
                          mode: "insensitive" as const,
                        },
                      },
                    ]
                  : []),
              ],
            }
          : { doNo: { contains: doNo, mode: "insensitive" } },
      ],
    },
    orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
    take: 50,
    select: {
      id: true,
      awbNo: true,
      doNo: true,
      transactionDate: true,
      status: true,
      originBranch: { select: { name: true } },
      destinationBranch: { select: { name: true } },
    },
  });
  return rows.map((t) => ({
    id: t.id,
    awbNo: t.awbNo ?? `#${t.id}`,
    doNo: t.doNo,
    date: businessDateString(t.transactionDate),
    origin: t.originBranch?.name ?? null,
    destination: t.destinationBranch?.name ?? null,
    status: t.status,
  }));
}

/** Full tracking card of one AWB in the actor's branches. */
export async function trackingDetail(
  actor: AccessActor,
  transactionId: number,
): Promise<TrackingDetail | null> {
  assertPermission(actor, "view", "transaction");
  const t = await prisma.transaction.findFirst({
    where: { id: transactionId, deletedAt: null, ...transactionScope(actor) },
    select: {
      id: true,
      createdAt: true,
      transactionDate: true,
      remarks: true,
      deliveryService: { select: { name: true } },
      transportMode: { select: { name: true } },
      manifestItems: {
        where: { deletedAt: null },
        orderBy: { assignedAt: "desc" },
        take: 1,
        select: {
          manifest: {
            select: {
              manifestNo: true,
              courier: { select: { name: true } },
              vehicle: { select: { licensePlate: true } },
            },
          },
        },
      },
      deliverySheetItems: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          receivedBy: true,
          deliveredAt: true,
          podPhotoUrl: true,
          deliverySheet: { select: { sheetNo: true } },
        },
      },
      finInvoiceItems: {
        orderBy: { id: "desc" },
        take: 1,
        select: { invoice: { select: { number: true, status: true } } },
      },
    },
  });
  if (!t) return null;
  const card = await awbForScan(actor, t.id);
  const manifest = t.manifestItems[0]?.manifest ?? null;
  const drs = t.deliverySheetItems[0] ?? null;
  const delivered = card.proofs.find((p) => p.outcome === "DELIVERED") ?? null;
  const receivedAt = delivered?.at ?? drs?.deliveredAt?.toISOString() ?? null;
  const receivedBy = delivered?.receiverName ?? drs?.receivedBy ?? null;
  const day = (iso: string) =>
    Date.parse(`${businessDateString(new Date(iso))}T00:00:00Z`);
  const leadTimeDays = receivedAt
    ? Math.max(
        0,
        Math.round(
          (day(receivedAt) - day(t.transactionDate.toISOString())) / 86_400_000,
        ),
      )
    : null;
  const photos = [
    ...(delivered?.photos.map((p) => p.url) ?? []),
    ...(drs?.podPhotoUrl ? [drs.podPhotoUrl] : []),
  ].slice(0, 2);
  const invoice = t.finInvoiceItems[0]?.invoice ?? null;
  return {
    ...card,
    inputAt: t.createdAt.toISOString(),
    service: t.deliveryService?.name ?? null,
    moda: t.transportMode?.name ?? null,
    manifestNo: manifest?.manifestNo ?? null,
    driver: manifest?.courier?.name ?? null,
    vehicle: manifest?.vehicle?.licensePlate ?? null,
    drsNo: drs?.deliverySheet.sheetNo ?? null,
    invoiceNo: invoice ? (invoice.number ?? `Draft (${invoice.status})`) : null,
    receivedAt,
    receivedBy,
    leadTimeDays,
    remarks: t.remarks,
    photos,
  };
}
