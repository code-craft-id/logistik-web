"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { IdentityError } from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";
import { deleteParty, type PartyKind, saveParty } from "./server/parties";

export type PartyResult = { ok: true } | { ok: false; message: string };

const kindOf = (v: FormDataEntryValue | null): PartyKind =>
  v === "consignee" ? "consignee" : "customer";

function failure(e: unknown): PartyResult {
  if (e instanceof IdentityError)
    return {
      ok: false,
      message:
        e.code === "UNAUTHENTICATED"
          ? "Sesi Anda berakhir. Silakan masuk kembali."
          : e.message && e.message !== e.code
            ? e.message
            : "Anda tidak memiliki akses untuk tindakan ini.",
    };
  if (e instanceof ZodError)
    return { ok: false, message: "Isian belum valid. Periksa nama dan email." };
  return {
    ok: false,
    message:
      "Belum tersimpan karena kesalahan sistem. Coba lagi; jika berulang, hubungi admin.",
  };
}

export async function savePartyAction(
  formData: FormData,
): Promise<PartyResult> {
  try {
    const current = await currentIdentity();
    if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
    const kind = kindOf(formData.get("kind"));
    const idValue = Number(formData.get("id"));
    const input = Object.fromEntries(
      [...formData.entries()].filter(([key]) => key !== "kind" && key !== "id"),
    );
    await saveParty(
      current.actor,
      kind,
      input,
      Number.isSafeInteger(idValue) && idValue > 0 ? idValue : undefined,
    );
    revalidatePath("/marketing");
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}

export async function deletePartyAction(
  formData: FormData,
): Promise<PartyResult> {
  try {
    const current = await currentIdentity();
    if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
    const idValue = Number(formData.get("id"));
    if (!Number.isSafeInteger(idValue) || idValue <= 0)
      return { ok: false, message: "Data tidak ditemukan." };
    await deleteParty(current.actor, kindOf(formData.get("kind")), idValue);
    revalidatePath("/marketing");
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}
