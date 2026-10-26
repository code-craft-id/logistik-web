import "server-only";
import {
  type AccessActor,
  isAdministrator,
} from "@/features/identity/permissions";
import {
  assertPermission,
  IdentityError,
  loadAccessActor,
} from "@/features/identity/server/access";
import type { Prisma, PrismaClient } from "@/lib/db/generated/client";
import {
  type PersonnelImportKind,
  type PersonnelImportLine,
  type PersonnelImportPreview,
  personnelImportKind,
} from "../personnel-import-contracts";
import {
  buildPersonnelTemplate,
  parsePersonnelSpreadsheet,
} from "./personnel-spreadsheet";

type PersonnelData = {
  name: string;
  address: string;
  nationalIdNumber: string;
  phone: string;
  driverLicenseNumber?: string;
  branchId: number;
  status: "ACTIVE" | "INACTIVE";
};
const normalized = (text: string) => text.trim().toLowerCase();
const fingerprint = (value: Omit<PersonnelData, "status">) =>
  JSON.stringify([
    normalized(value.name),
    value.address.trim(),
    value.nationalIdNumber.trim(),
    value.phone.trim(),
    (value.driverLicenseNumber ?? "").trim(),
    value.branchId,
  ]);
export function createPersonnelImportService(
  db: PrismaClient,
  resolveActor: () => Promise<AccessActor | null>,
) {
  async function actor(kind: PersonnelImportKind) {
    const current = await resolveActor();
    assertPermission(current, "view", kind);
    assertPermission(current, "create", kind);
    return current;
  }
  const branchScope = (current: AccessActor): Prisma.BranchWhereInput => ({
    deletedAt: null,
    status: "ACTIVE",
    office: { deletedAt: null, status: "ACTIVE", company: { deletedAt: null } },
    ...(!isAdministrator(current) ? { id: { in: current.branchIds } } : {}),
  });
  async function validate(
    tx: Prisma.TransactionClient,
    current: AccessActor,
    lines: PersonnelImportLine[],
    kind: PersonnelImportKind,
  ) {
    const branchNames = [...new Set(lines.map((line) => line.branch))];
    const branches = await tx.branch.findMany({
      where: {
        ...branchScope(current),
        OR: branchNames.flatMap((name) => [
          { code: { equals: name, mode: "insensitive" as const } },
          { name: { equals: name, mode: "insensitive" as const } },
        ]),
      },
      select: { id: true, code: true, name: true },
      take: 1001,
    });
    const issues: PersonnelImportPreview["issues"] = [];
    const resolved: { row: number; data: PersonnelData; branch: string }[] = [];
    const seen = new Set<string>();
    for (const line of lines) {
      const matches = branches.filter(
        (branch) =>
          normalized(branch.code) === normalized(line.branch) ||
          normalized(branch.name) === normalized(line.branch),
      );
      if (matches.length !== 1) {
        issues.push({
          row: line.row,
          message: matches.length
            ? "Kode/nama cabang ambigu. Gunakan kode cabang yang unik."
            : "Cabang tidak ditemukan, tidak aktif, atau di luar akses Anda.",
        });
        continue;
      }
      const { row, branch: _branch, ...scalars } = line;
      const data = { ...scalars, branchId: matches[0].id };
      const key = fingerprint(data);
      if (seen.has(key))
        issues.push({
          row,
          message: "Baris personel identik berulang dalam file.",
        });
      seen.add(key);
      resolved.push({ row, data, branch: matches[0].name });
    }
    if (resolved.length) {
      const query = {
        where: {
          deletedAt: null,
          branchId: {
            in: [...new Set(resolved.map((line) => line.data.branchId))],
          },
          OR: [...new Set(resolved.map((line) => line.data.name))].map(
            (name) => ({
              name: { equals: name, mode: "insensitive" as const },
            }),
          ),
        },
        select: {
          name: true,
          address: true,
          nationalIdNumber: true,
          phone: true,
          branchId: true,
        },
        take: 5001,
      };
      const existing =
        kind === "driver"
          ? await tx.driver.findMany({
              ...query,
              select: { ...query.select, driverLicenseNumber: true },
            })
          : kind === "courier"
            ? await tx.courier.findMany(query)
            : await tx.marketingPerson.findMany(query);
      if (existing.length > 5000)
        throw new IdentityError(
          "IMPORT_TOO_BROAD",
          400,
          "Terlalu banyak data pembanding. Pisahkan file menjadi bagian yang lebih kecil.",
        );
      const keys = new Set(
        existing.map((row) =>
          fingerprint({ ...row, branchId: row.branchId ?? -1 }),
        ),
      );
      for (const line of resolved)
        if (keys.has(fingerprint(line.data)))
          issues.push({
            row: line.row,
            message:
              "Personel identik sudah tersimpan. Impor tidak menimpa data lama.",
          });
    }
    const preview: PersonnelImportPreview = {
      count: lines.length,
      valid: issues.length === 0,
      rows: resolved.slice(0, 50).map((line) => ({
        row: line.row,
        name: line.data.name,
        branch: line.branch,
        status: line.data.status,
      })),
      issues,
    };
    return { preview, data: resolved.map((line) => line.data) };
  }
  return {
    async template(inputKind: unknown) {
      const kind = personnelImportKind.parse(inputKind);
      const current = await actor(kind);
      const branches = await db.branch.findMany({
        where: branchScope(current),
        select: { code: true, name: true },
        orderBy: [{ code: "asc" }, { id: "asc" }],
        take: 1000,
      });
      return buildPersonnelTemplate(kind, branches);
    },
    async preview(inputKind: unknown, bytes: Uint8Array) {
      const kind = personnelImportKind.parse(inputKind);
      const current = await actor(kind);
      const lines = parsePersonnelSpreadsheet(kind, bytes);
      const { preview } = await validate(db, current, lines, kind);
      return preview;
    },
    async import(inputKind: unknown, bytes: Uint8Array) {
      const kind = personnelImportKind.parse(inputKind);
      const initial = await actor(kind);
      const lines = parsePersonnelSpreadsheet(kind, bytes);
      return db.$transaction(
        async (tx) => {
          await tx.$executeRaw`SET LOCAL lock_timeout = '5s'`;
          await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(71642, 1)`;
          if ((await resolveActor())?.id !== initial.id)
            throw new IdentityError("UNAUTHENTICATED", 401);
          const current = await loadAccessActor(tx, initial.id);
          assertPermission(current, "view", kind);
          assertPermission(current, "create", kind);
          const { preview, data } = await validate(tx, current, lines, kind);
          if (!preview.valid)
            throw new IdentityError(
              "INVALID_IMPORT",
              400,
              `Impor dibatalkan: ${preview.issues.length} masalah validasi. Periksa file kembali.`,
            );
          const created =
            kind === "driver"
              ? await tx.driver.createManyAndReturn({
                  data: data.map((row) => ({
                    ...row,
                    driverLicenseNumber: row.driverLicenseNumber ?? "",
                  })),
                  select: { id: true },
                })
              : kind === "courier"
                ? await tx.courier.createManyAndReturn({
                    data,
                    select: { id: true },
                  })
                : await tx.marketingPerson.createManyAndReturn({
                    data,
                    select: { id: true },
                  });
          await tx.identityAuditEvent.createMany({
            data: created.map((record) => ({
              actorId: current.id,
              action: "REFERENCE_IMPORTED",
              subjectType: kind,
              subjectId: record.id,
            })),
          });
          return { count: created.length };
        },
        { timeout: 15000 },
      );
    },
  };
}
