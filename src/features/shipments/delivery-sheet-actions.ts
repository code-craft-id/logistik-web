"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { IdentityError } from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";
import type { ModulResult } from "@/features/modul/actions";
import { Prisma } from "@/lib/db/generated/client";
import {
  addAwbToDeliverySheet,
  createStandaloneDeliverySheet,
  deleteStandaloneDeliverySheet,
  removeAwbFromDeliverySheet,
} from "./server/delivery-sheets";

type DeliverySheetResult = ModulResult;

function failure(e: unknown): DeliverySheetResult {
  if (e instanceof IdentityError) {
    if (e.code === "UNAUTHENTICATED")
      return {
        ok: false,
        message: "Sesi Anda berakhir. Silakan masuk kembali.",
      };
    if (e.code === "CONFLICT") return { ok: false, message: e.message };
    if (e.code === "NOT_FOUND")
      return { ok: false, message: "DRS tidak ditemukan atau sudah dihapus." };
    return {
      ok: false,
      message: "Anda tidak memiliki akses ke cabang atau DRS ini.",
    };
  }
  if (e instanceof ZodError)
    return { ok: false, message: "Isian belum valid. Periksa kembali form." };
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
    return { ok: false, message: "Nomor DRS sudah dipakai." };
  return {
    ok: false,
    message:
      "Belum tersimpan karena kesalahan sistem. Coba lagi; jika berulang, hubungi admin.",
  };
}

async function actor() {
  const current = await currentIdentity();
  if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
  return current.actor;
}

const fields = (formData: FormData) =>
  Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string"),
  );

export async function createDeliverySheetAction(
  formData: FormData,
): Promise<DeliverySheetResult> {
  try {
    const sheet = await createStandaloneDeliverySheet(
      await actor(),
      fields(formData),
    );
    revalidatePath("/delivery-sheets");
    return {
      ok: true,
      message: "DRS dibuat. Tambahkan AWB yang akan diantar.",
      redirect: `/delivery-sheets/${sheet.id}`,
    };
  } catch (e) {
    return failure(e);
  }
}

export async function addAwbToDeliverySheetAction(
  formData: FormData,
): Promise<DeliverySheetResult> {
  try {
    await addAwbToDeliverySheet(await actor(), fields(formData));
    revalidatePath(`/delivery-sheets/${formData.get("deliverySheetId")}`);
    return {
      ok: true,
      message: `AWB ${String(formData.get("awbNo") ?? "").trim()} ditambahkan.`,
    };
  } catch (e) {
    return failure(e);
  }
}

export async function removeAwbFromDeliverySheetAction(
  formData: FormData,
): Promise<DeliverySheetResult> {
  try {
    const sheet = await removeAwbFromDeliverySheet(
      await actor(),
      fields(formData),
    );
    revalidatePath(`/delivery-sheets/${sheet.id}`);
    return { ok: true, message: "AWB dihapus dari DRS." };
  } catch (e) {
    return failure(e);
  }
}

export async function deleteDeliverySheetAction(
  formData: FormData,
): Promise<DeliverySheetResult> {
  try {
    await deleteStandaloneDeliverySheet(await actor(), fields(formData));
    revalidatePath("/delivery-sheets");
    return { ok: true, message: `DRS dihapus.`, redirect: "/delivery-sheets" };
  } catch (e) {
    return failure(e);
  }
}
