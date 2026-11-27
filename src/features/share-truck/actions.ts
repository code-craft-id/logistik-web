"use server";

import { revalidatePath } from "next/cache";
import type { AccessActor } from "@/features/identity/permissions";
import { IdentityError } from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";
import type { ModulResult } from "@/features/modul/actions";
import { ModulError } from "@/features/modul/server/common";
import {
  advanceOrderStatus,
  createCharterInvoice,
  createIncomingOrder,
  createOutgoingOrder,
  decideIncomingOrder,
  payCharterInvoice,
  shareTruck,
  unshareTruck,
} from "./server";

const fields = (formData: FormData) =>
  Object.fromEntries(
    [...formData.entries()].filter(
      ([key, value]) => typeof value === "string" && !key.startsWith("$"),
    ),
  );

function action(
  work: (actor: AccessActor, data: Record<string, unknown>) => Promise<unknown>,
  message: string,
) {
  return async (formData: FormData): Promise<ModulResult> => {
    try {
      const current = await currentIdentity();
      if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
      await work(current.actor, fields(formData));
      revalidatePath("/share-truck", "layout");
      return { ok: true, message };
    } catch (e) {
      if (e instanceof ModulError) return { ok: false, message: e.message };
      if (e instanceof IdentityError)
        return {
          ok: false,
          message:
            e.code === "UNAUTHENTICATED"
              ? "Sesi Anda berakhir. Silakan masuk kembali."
              : "Grup Anda belum memiliki hak Share Truck: kelola. Minta admin menambahkannya di Hak Akses Menu.",
        };
      console.error(
        "share truck action failed",
        e instanceof Error ? e.name : "unknown",
      );
      return {
        ok: false,
        message: "Belum tersimpan karena kesalahan sistem. Coba lagi.",
      };
    }
  };
}

export async function shareTruckAction(formData: FormData) {
  return action(shareTruck, "Truk dibagikan (Share).")(formData);
}
export async function unshareTruckAction(formData: FormData) {
  return action(unshareTruck, "Truk tidak dibagikan lagi (Unshare).")(formData);
}
export async function createIncomingOrderAction(formData: FormData) {
  return action(
    createIncomingOrder,
    "Order dibuat dan masuk ke Order Masuk Charter.",
  )(formData);
}
export async function createOutgoingOrderAction(formData: FormData) {
  return action(createOutgoingOrder, "Order Keluar Charter dibuat.")(formData);
}
export async function decideIncomingOrderAction(formData: FormData) {
  return action(decideIncomingOrder, "Keputusan order disimpan.")(formData);
}
export async function advanceOrderStatusAction(formData: FormData) {
  return action(advanceOrderStatus, "Status order diperbarui.")(formData);
}
export async function createCharterInvoiceAction(formData: FormData) {
  return action(createCharterInvoice, "Invoice dibuat.")(formData);
}
export async function payCharterInvoiceAction(formData: FormData) {
  return action(payCharterInvoice, "Invoice ditandai lunas.")(formData);
}
