"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { IdentityError } from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";
import { requirePermission } from "@/lib/auth/session";
import {
  cloudinaryConfigured,
  destroyImage,
  UploadError,
  uploadWebp,
} from "@/lib/cloudinary";
import { Prisma } from "@/lib/db/generated/client";
import {
  assignToManifestSchema,
  createManifestSchema,
  deliveryOutcomeSchema,
} from "./manifests-schemas";
import { createDeliverySheet } from "./server/delivery-sheets";
import { findAssignableTransaction } from "./server/manifests-queries";
import {
  assignTransactionToManifest,
  attachDeliveryPhoto,
  createManifest,
  recordDeliveryOutcome,
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
  return {
    ok: false,
    message:
      "Belum tersimpan karena kesalahan sistem. Coba lagi; jika berulang, hubungi admin.",
  };
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
    if (transaction === "AMBIGUOUS")
      return {
        ok: false,
        message:
          "Nomor AWB ini dipakai di lebih dari satu cabang asal. Hubungi admin untuk memastikan AWB yang dimaksud.",
      };
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

export async function createDeliverySheetFormAction(
  formData: FormData,
): Promise<ManifestFormResult> {
  try {
    const current = await currentIdentity();
    if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
    const sheet = await createDeliverySheet(
      current.actor,
      Object.fromEntries(formData.entries()),
    );
    revalidatePath(`/manifest/${formData.get("manifestId")}`);
    return { ok: true, id: sheet.id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return {
        ok: false,
        message: "Nomor DRS sudah dipakai, atau manifest ini sudah punya DRS.",
      };
    if (e instanceof IdentityError && e.code === "CONFLICT")
      return { ok: false, message: e.message };
    return failure(e);
  }
}

const outcomeMessages: Record<string, string> = {
  DELIVERY_OUTCOME_FINAL: "Hasil antar AWB ini sudah final.",
  INVALID_STATUS_TRANSITION:
    "Status AWB belum In Transit; ubah status AWB dulu sebelum dicatat terkirim.",
  MANIFEST_ITEM_NOT_FOUND: "AWB tidak aktif di manifest ini.",
  DELIVERY_OUTCOME_CONCURRENTLY_UPDATED:
    "Data berubah bersamaan. Muat ulang halaman.",
  STATUS_CONCURRENTLY_UPDATED: "Data berubah bersamaan. Muat ulang halaman.",
  DELIVERY_SHEET_ITEM_NOT_FOUND: "AWB tidak ada di lembar pengantaran ini.",
  DELIVERY_PHOTO_NEEDS_OUTCOME: "Catat hasil antar dulu sebelum menambah foto.",
  DELIVERY_PHOTO_EXISTS: "AWB ini sudah punya foto bukti terima.",
};

/** A non-empty uploaded file under `photo`, or undefined. */
function photoFile(formData: FormData) {
  const value = formData.get("photo");
  return value instanceof File && value.size > 0 ? value : undefined;
}

export async function recordOutcomeFormAction(
  formData: FormData,
): Promise<ManifestFormResult> {
  try {
    await requirePermission("update", "delivery");
    const current = await currentIdentity();
    if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
    const raw = Object.fromEntries(
      [...formData.entries()].filter(
        ([key, v]) =>
          key !== "manifestId" &&
          key !== "photo" &&
          typeof v === "string" &&
          v !== "",
      ),
    );
    const input = deliveryOutcomeSchema.parse(raw);
    const file = photoFile(formData);
    const photo = file ? await uploadWebp(file) : undefined;
    try {
      const result = await recordDeliveryOutcome(input, current.actor, photo);
      revalidatePath(`/manifest/${formData.get("manifestId")}`);
      return { ok: true, id: result?.id ?? 0 };
    } catch (e) {
      // Do not leave an orphan image when the outcome was not saved.
      if (photo) await destroyImage(photo.publicId);
      throw e;
    }
  } catch (e) {
    if (e instanceof UploadError) return { ok: false, message: e.message };
    if (e instanceof Error && !(e instanceof IdentityError)) {
      const known = Object.keys(outcomeMessages).find((k) =>
        e.message.startsWith(k),
      );
      if (known) return { ok: false, message: outcomeMessages[known] };
    }
    return failure(e);
  }
}

/** Add a proof-of-delivery photo to a line that already has an outcome. */
export async function attachDeliveryPhotoFormAction(
  formData: FormData,
): Promise<ManifestFormResult> {
  try {
    await requirePermission("update", "delivery");
    const current = await currentIdentity();
    if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
    const deliverySheetId = Number(formData.get("deliverySheetId"));
    const transactionId = Number(formData.get("transactionId"));
    if (
      !Number.isSafeInteger(deliverySheetId) ||
      !Number.isSafeInteger(transactionId) ||
      deliverySheetId <= 0 ||
      transactionId <= 0
    )
      return {
        ok: false,
        message: "Data AWB tidak valid. Muat ulang halaman.",
      };
    const file = photoFile(formData);
    if (!file) return { ok: false, message: "Pilih foto terlebih dahulu." };
    const photo = await uploadWebp(file);
    try {
      const result = await attachDeliveryPhoto(
        { deliverySheetId, transactionId },
        current.actor,
        photo,
      );
      revalidatePath(`/manifest/${formData.get("manifestId")}`);
      revalidatePath(`/transactions/${transactionId}`);
      return { ok: true, id: result.id };
    } catch (e) {
      await destroyImage(photo.publicId);
      throw e;
    }
  } catch (e) {
    if (e instanceof UploadError) return { ok: false, message: e.message };
    if (e instanceof Error && !(e instanceof IdentityError)) {
      const known = Object.keys(outcomeMessages).find((k) =>
        e.message.startsWith(k),
      );
      if (known) return { ok: false, message: outcomeMessages[known] };
    }
    return failure(e);
  }
}

/** Whether photo upload is configured (no secrets exposed). */
export async function photoUploadEnabledAction() {
  return cloudinaryConfigured();
}
