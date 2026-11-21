import { IdentityError } from "@/features/identity/server/access";
import { Prisma } from "@/lib/db/generated/client";

export const quantitySelect = { koli: true, kilo: true, volume: true } as const;
type Source = {
  groupId: number;
  transaction: {
    koli: number | null;
    kilo: Prisma.Decimal | null;
    volume: Prisma.Decimal | null;
  };
};

export function quantityTotals(ids: number[], rows: Source[]) {
  if (rows.length > 10_000)
    throw new IdentityError(
      "REPORT_LIMIT",
      422,
      "Rincian kuantitas melebihi 10.000 item. Persempit periode atau kurangi ukuran halaman.",
    );
  const totals = new Map(
    ids.map((id) => [
      id,
      {
        koli: 0 as number | null,
        kilo: new Prisma.Decimal(0) as Prisma.Decimal | null,
        volume: new Prisma.Decimal(0) as Prisma.Decimal | null,
      },
    ]),
  );
  for (const { groupId, transaction: source } of rows) {
    const sum = totals.get(groupId);
    if (!sum) throw new Error("Quantity source outside requested report page");
    sum.koli =
      sum.koli === null || source.koli === null ? null : sum.koli + source.koli;
    sum.kilo =
      sum.kilo === null || source.kilo === null
        ? null
        : sum.kilo.plus(source.kilo);
    sum.volume =
      sum.volume === null || source.volume === null
        ? null
        : sum.volume.plus(source.volume);
  }
  return new Map(
    [...totals].map(([id, sum]) => [
      id,
      {
        totalKoli: sum.koli,
        totalKilo: sum.kilo?.toString() ?? null,
        totalVolume: sum.volume?.toString() ?? null,
      },
    ]),
  );
}
