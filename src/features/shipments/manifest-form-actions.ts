"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { IdentityError } from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";
import { requirePermission } from "@/lib/auth/session";
import { Prisma } from "@/lib/db/generated/client";
import {
  assignToManifestSchema,
  createManifestSchema,
} from "./manifests-schemas";
import { findAssignableTransaction } from "./server/manifests-queries";
import {
  assignTransactionToManifest,
  createManifest,
} from "./server/manifests-service";

export type ManifestFormResult =
  | { ok: true; id: number }
  | { ok: false; message: string };

/** Map service failures to user-facing text; never leak internal messages. */
function failure(e: unknown): ManifestFormResult {
  if (e instanceof IdentityError) {
    if (e.code === "UNAUTHENTICATED")
      return {
        ok: false,
        message: "Sesi Anda berakhir. Silakan masuk kembali.",
      };
    return {
      ok: false,
      message:
        e.message &&
        e.code === "FORBIDDEN_BRANCH" &&
        e.message !== "FORBIDDEN_BRANCH"
          ? e.message
          : "Anda tidak memiliki akses ke cabang, kendaraan, kurir atau AWB yang dipilih.",
    };
  }
  if (e instanceof ZodError)
    return { ok: false, message: "Isian belum valid. Periksa kembali form." };
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
    return { ok: false, message: "Nomor manifest sudah dipakai." };
  if (e instanceof Error) {
    if (e.message === "TRANSACTION_ALREADY_ASSIGNED")
      return {
        ok: false,
        message: "AWB ini sudah ada di manifest aktif lain.",
      };
    if (e.message.startsWith("TRANSACTION_REASSIGNMENT_BLOCKED_D08"))
      return {
        ok: false,
        message:
          "AWB ini pernah dimanifest lalu dilepas; manifest ulang belum diizinkan (D-08).",
      };
    if (e.message === "MANIFEST_NOT_ASSIGNABLE")
      return { ok: false, message: "Manifest sudah ditutup." };
  }
  return { ok: false, message: "Belum tersimpan. Silakan coba lagi." };
}

export async function createManifestFormAction(
  formData: FormData,
): Promise<ManifestFormResult> {
  try {
    await requirePermission("create", "manifest");
    const current = await currentIdentity();
    if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
    const raw = Object.fromEntries(
      [...formData.entries()].filter(([, v]) => v !== ""),
    );
    const created = await createManifest(
      createManifestSchema.parse(raw),
      current.actor,
    );
    revalidatePath("/manifest");
    return { ok: true, id: created.id };
  } catch (e) {
    return failure(e);
  }
}

export async function assignAwbFormAction(
  formData: FormData,
): Promise<ManifestFormResult> {
  try {
    await requirePermission("update", "manifest");
    const current = await currentIdentity();
    if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
    const awbNo = String(formData.get("awbNo") ?? "").trim();
    if (!awbNo || awbNo.length > 50)
      return { ok: false, message: "Isi nomor AWB (maksimal 50 karakter)." };
    const transaction = await findAssignableTransaction(current.actor, awbNo);
    if (!transaction)
      return {
        ok: false,
        message: "AWB tidak ditemukan dalam cakupan cabang Anda.",
      };
    const item = await assignTransactionToManifest(
      assignToManifestSchema.parse({
        manifestId: formData.get("manifestId"),
        transactionId: transaction.id,
      }),
      current.actor,
    );
    revalidatePath(`/manifest/${formData.get("manifestId")}`);
    revalidatePath("/manifest");
    return { ok: true, id: item.id };
  } catch (e) {
    return failure(e);
  }
}
