import "server-only";

import {
  type AccessActor,
  isAdministrator,
  permits,
} from "@/features/identity/permissions";
import { assertPermission } from "@/features/identity/server/access";
import { ModulError } from "@/features/modul/server/common";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/db/generated/client";

/**
 * Koli scan at a transit or destination branch, as on the provider's Cek
 * Transit / Cek Inbound detail (OBSERVED 2026-11-19): "Masukan No. AWB/Koli
 * No. [ENTER]", SCAN KOLI x/n and SISA KOLI per AWB. Owner-approved (D-05).
 * Pindah Manifest is not offered: a released AWB cannot join another
 * manifest until D-08 (re-manifest rules) is decided.
 */
export type ScanKind = "TRANSIT" | "INBOUND";
export const SCAN_KINDS: Record<ScanKind, string> = {
  TRANSIT: "Transit",
  INBOUND: "Inbound",
};

type ScanManifest = {
  id: number;
  manifestNo: string;
  destinationBranchId: number | null;
  status: string;
  transits: string[];
  courier: string | null;
  plate: string | null;
};

async function loadManifest(id: number): Promise<ScanManifest | null> {
  const m = await prisma.manifest.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      manifestNo: true,
      destinationBranchId: true,
      status: true,
      transit1: true,
      transit2: true,
      transit3: true,
      transit4: true,
      transit5: true,
      courier: { select: { name: true } },
      vehicle: { select: { licensePlate: true } },
    },
  });
  if (!m) return null;
  return {
    id: m.id,
    manifestNo: m.manifestNo,
    destinationBranchId: m.destinationBranchId,
    status: m.status,
    transits: [m.transit1, m.transit2, m.transit3, m.transit4, m.transit5]
      .map((t) => (t ?? "").trim())
      .filter((t) => t !== "" && t !== "-"),
    courier: m.courier?.name ?? null,
    plate: m.vehicle?.licensePlate ?? null,
  };
}

/**
 * The branch the actor scans for: the destination for INBOUND, a branch
 * named in Transit1..5 for TRANSIT. Administrators may scan for any.
 * Returns the branch id and, for transit, its position (Transit Ke-).
 */
async function scanBranch(
  actor: AccessActor,
  manifest: ScanManifest,
  kind: ScanKind,
): Promise<{ branchId: number | null; transitNo: number | null }> {
  const admin = isAdministrator(actor);
  if (kind === "INBOUND") {
    if (
      manifest.destinationBranchId &&
      (admin || actor.branchIds.includes(manifest.destinationBranchId))
    )
      return { branchId: manifest.destinationBranchId, transitNo: null };
    throw new ModulError(
      "Scan inbound hanya untuk cabang tujuan manifest ini.",
    );
  }
  const names = manifest.transits.map((t) => t.toLowerCase());
  const own = await prisma.branch.findMany({
    where: {
      deletedAt: null,
      ...(admin ? {} : { id: { in: actor.branchIds } }),
    },
    select: { id: true, name: true },
  });
  const match = own.find((b) => names.includes(b.name.trim().toLowerCase()));
  if (match)
    return {
      branchId: match.id,
      transitNo: names.indexOf(match.name.trim().toLowerCase()) + 1,
    };
  if (admin) return { branchId: null, transitNo: null };
  throw new ModulError(
    "Scan transit hanya untuk cabang yang tercantum di Transit1-5 manifest ini.",
  );
}

export type ScanRow = {
  transactionId: number;
  awbNo: string;
  sender: string | null;
  receiver: string | null;
  fee: string | null;
  heaviest: string | null;
  koli: number;
  scanned: number;
  /** Pindah Manifest: target manifest number once moved, else null. */
  movedTo: string | null;
};
/** Manifest statuses that can still receive a moved AWB. */
const MOVE_TARGET_STATUSES = ["Draft", "Loaded", "In Transit"];

/** Detail page data: header and per-AWB scan progress. */
export async function manifestScanView(
  actor: AccessActor,
  manifestId: number,
  kind: ScanKind,
) {
  assertPermission(actor, "view", "manifest");
  const manifest = await loadManifest(manifestId);
  if (!manifest) throw new ModulError("Manifest tidak ditemukan.");
  const where = await scanBranch(actor, manifest, kind);
  const items = await prisma.manifestItem.findMany({
    where: {
      manifestId,
      deletedAt: null,
      OR: [{ releasedAt: null }, { movedToManifestId: { not: null } }],
    },
    orderBy: { id: "asc" },
    select: {
      movedToManifest: { select: { manifestNo: true } },
      transaction: {
        select: {
          id: true,
          awbNo: true,
          senderName: true,
          receiverName: true,
          biaya: true,
          kilo: true,
          volume: true,
          chargeableWeight: true,
          koli: true,
        },
      },
    },
  });
  const counts = await prisma.manifestScan.groupBy({
    by: ["transactionId"],
    where: { manifestId, kind },
    _count: { _all: true },
  });
  const scanned = new Map(counts.map((c) => [c.transactionId, c._count._all]));
  const rows: ScanRow[] = items.map(({ transaction: t, movedToManifest }) => {
    const kilo = t.kilo ? Number(t.kilo) : 0;
    const volume = t.volume ? Number(t.volume) : 0;
    return {
      transactionId: t.id,
      awbNo: t.awbNo ?? `#${t.id}`,
      sender: t.senderName,
      receiver: t.receiverName,
      fee: t.biaya?.toString() ?? null,
      heaviest:
        t.chargeableWeight?.toString() ??
        (kilo || volume ? String(Math.max(kilo, volume)) : null),
      koli: Math.max(1, t.koli ?? 1),
      scanned: scanned.get(t.id) ?? 0,
      movedTo: movedToManifest?.manifestNo ?? null,
    };
  });
  const targets = permits(actor, "update", "manifest")
    ? await moveTargets(actor, manifest)
    : [];
  return {
    manifest,
    kind,
    transitNo: where.transitNo,
    rows,
    targets,
    totalKoli: rows.reduce((t, r) => t + r.koli, 0),
    totalScanned: rows.reduce((t, r) => t + Math.min(r.scanned, r.koli), 0),
  };
}

/**
 * Record one koli scan. "AWB-n" scans koli n; a bare AWB scans its next
 * unscanned koli. Serialized per manifest with an advisory lock; the
 * unique index refuses a second scan of the same koli.
 */
export async function scanKoli(
  actor: AccessActor,
  manifestId: number,
  kind: ScanKind,
  rawCode: string,
) {
  assertPermission(actor, "update", "manifest");
  const code = rawCode.replace(/\s+/g, "").slice(0, 60);
  if (!code) throw new ModulError("Nomor AWB/Koli kosong.");
  const manifest = await loadManifest(manifestId);
  if (!manifest) throw new ModulError("Manifest tidak ditemukan.");
  if (manifest.status === "Draft")
    throw new ModulError("Manifest masih Draft; belum bisa di-scan.");
  const where = await scanBranch(actor, manifest, kind);
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`manifest-scan:${manifestId}:${kind}`}))`;
    const items = await tx.manifestItem.findMany({
      where: { manifestId, releasedAt: null, deletedAt: null },
      select: {
        transaction: { select: { id: true, awbNo: true, koli: true } },
      },
    });
    const byAwb = (no: string) =>
      items.find(
        (i) => (i.transaction.awbNo ?? "").toUpperCase() === no.toUpperCase(),
      )?.transaction;
    let target = byAwb(code);
    let piece: number | null = null;
    const label = /^(.+)-(\d{1,3})$/.exec(code);
    if (target && label) {
      const parent = byAwb(label[1]);
      const requestedPiece = Number(label[2]);
      if (
        parent &&
        requestedPiece >= 1 &&
        requestedPiece <= Math.max(1, parent.koli ?? 1)
      )
        throw new ModulError(
          `Kode ${code} cocok sebagai AWB dan sebagai koli. Gunakan barcode AWB atau label koli yang tidak ambigu.`,
        );
    }
    if (!target && label) {
      target = byAwb(label[1]);
      piece = Number(label[2]);
    }
    if (!target)
      throw new ModulError(`AWB/Koli ${code} tidak ada di manifest ini.`);
    const koli = Math.max(1, target.koli ?? 1);
    const done = await tx.manifestScan.findMany({
      where: { manifestId, transactionId: target.id, kind },
      select: { piece: true },
    });
    const taken = new Set(done.map((d) => d.piece));
    if (piece === null) {
      piece =
        Array.from({ length: koli }, (_, i) => i + 1).find(
          (p) => !taken.has(p),
        ) ?? null;
      if (piece === null)
        throw new ModulError(
          `Semua koli AWB ${target.awbNo} sudah di-scan (${koli}/${koli}).`,
        );
    } else if (piece < 1 || piece > koli) {
      throw new ModulError(
        `Koli ${piece} tidak ada; AWB ${target.awbNo} hanya ${koli} koli.`,
      );
    } else if (taken.has(piece)) {
      throw new ModulError(`Koli ${target.awbNo}-${piece} sudah di-scan.`);
    }
    try {
      await tx.manifestScan.create({
        data: {
          manifestId,
          transactionId: target.id,
          piece,
          kind,
          branchId: where.branchId,
          scannedById: actor.id,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      )
        throw new ModulError(`Koli ${target.awbNo}-${piece} sudah di-scan.`);
      throw error;
    }
    return {
      awbNo: target.awbNo ?? `#${target.id}`,
      piece,
      scanned: taken.size + 1,
      koli,
    };
  });
}

/** First transit scan per manifest: User Transit / Transit Date. */
export async function firstTransitScans(manifestIds: number[]) {
  if (!manifestIds.length)
    return new Map<number, { user: string | null; at: Date }>();
  const rows = await prisma.$queryRaw<
    { manifestId: number; user: string | null; at: Date }[]
  >`
    SELECT DISTINCT ON (s.manifest_id) s.manifest_id AS "manifestId",
           u.name AS "user", s.created_at AS at
    FROM manifest_scans s LEFT JOIN auth_users u ON u.id = s.scanned_by_id
    WHERE s.kind = 'TRANSIT' AND s.manifest_id IN (${Prisma.join(manifestIds)})
    ORDER BY s.manifest_id, s.created_at`;
  return new Map(rows.map((r) => [r.manifestId, { user: r.user, at: r.at }]));
}

/** First inbound scan per AWB: Acc. In. */
export async function firstInboundScans(transactionIds: number[]) {
  if (!transactionIds.length) return new Map<number, Date>();
  const rows = await prisma.$queryRaw<{ transactionId: number; at: Date }[]>`
    SELECT s.transaction_id AS "transactionId", min(s.created_at) AS at
    FROM manifest_scans s
    WHERE s.kind = 'INBOUND' AND s.transaction_id IN (${Prisma.join(transactionIds)})
    GROUP BY s.transaction_id`;
  return new Map(rows.map((r) => [r.transactionId, r.at]));
}

/** Pindah Manifest targets: other manifests to the same destination (OBSERVED). */
async function moveTargets(actor: AccessActor, manifest: ScanManifest) {
  if (!manifest.destinationBranchId) return [];
  const [destination, targets] = await Promise.all([
    prisma.branch.findUnique({
      where: { id: manifest.destinationBranchId },
      select: { name: true },
    }),
    prisma.manifest.findMany({
      where: {
        id: { not: manifest.id },
        deletedAt: null,
        destinationBranchId: manifest.destinationBranchId,
        status: { in: MOVE_TARGET_STATUSES },
        ...(isAdministrator(actor)
          ? {}
          : {
              OR: [
                { originBranchId: { in: actor.branchIds } },
                { branchId: { in: actor.branchIds } },
              ],
            }),
      },
      orderBy: [{ manifestDate: "desc" }, { id: "desc" }],
      take: 200,
      select: { id: true, manifestNo: true },
    }),
  ]);
  return targets.map((t) => ({
    ...t,
    destination: destination?.name ?? "-",
  }));
}

/**
 * Pindah Manifest (OBSERVED sandbox Cek Transit detail, 2026-11-27): scanned
 * AWBs of this manifest move to another manifest with the same destination.
 * The source row is released and records the target; the new row records
 * the source. Serialized per manifest; the partial unique index keeps one
 * active manifest row per AWB.
 */
export async function moveToManifest(
  actor: AccessActor,
  manifestId: number,
  kind: ScanKind,
  targetManifestId: number,
  transactionIds: number[],
) {
  assertPermission(actor, "update", "manifest");
  const ids = [...new Set(transactionIds)].filter(
    (id) => Number.isSafeInteger(id) && id > 0,
  );
  if (!ids.length) throw new ModulError("Centang AWB yang akan dipindah.");
  if (ids.length > 500) throw new ModulError("Maksimal 500 AWB sekali pindah.");
  const manifest = await loadManifest(manifestId);
  if (!manifest) throw new ModulError("Manifest tidak ditemukan.");
  await scanBranch(actor, manifest, kind);
  const target = (await moveTargets(actor, manifest)).find(
    (m) => m.id === targetManifestId,
  );
  if (!target)
    throw new ModulError(
      "Pilih manifest tujuan dengan tujuan yang sama dan belum tiba.",
    );
  return prisma.$transaction(async (tx) => {
    for (const id of [manifestId, targetManifestId].sort((a, b) => a - b))
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`manifest-move:${id}`}))`;
    const items = await tx.manifestItem.findMany({
      where: {
        manifestId,
        transactionId: { in: ids },
        releasedAt: null,
        deletedAt: null,
      },
      select: {
        id: true,
        transactionId: true,
        transaction: { select: { awbNo: true } },
      },
    });
    if (items.length !== ids.length)
      throw new ModulError(
        "Sebagian AWB sudah tidak ada di manifest ini. Muat ulang halaman.",
      );
    const scans = await tx.manifestScan.groupBy({
      by: ["transactionId"],
      where: { manifestId, kind, transactionId: { in: ids } },
      _count: { _all: true },
    });
    const scanned = new Set(scans.map((x) => x.transactionId));
    const unscanned = items.filter((i) => !scanned.has(i.transactionId));
    if (unscanned.length)
      throw new ModulError(
        `Scan dulu AWB ${unscanned.map((i) => i.transaction.awbNo ?? `#${i.transactionId}`).join(", ")} sebelum dipindah.`,
      );
    const now = new Date();
    for (const item of items) {
      await tx.manifestItem.update({
        where: { id: item.id },
        data: { releasedAt: now, movedToManifestId: targetManifestId },
      });
      await tx.manifestItem.create({
        data: {
          manifestId: targetManifestId,
          transactionId: item.transactionId,
          assignedById: actor.id,
          movedFromManifestId: manifestId,
        },
      });
    }
    return { moved: items.length, target: target.manifestNo };
  });
}
