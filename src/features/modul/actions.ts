"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import type { AccessActor } from "@/features/identity/permissions";
import { IdentityError } from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";
import { Prisma } from "@/lib/db/generated/client";
import {
  applyApprovedEdit,
  decideAwbChange,
  requestAwbChange,
} from "./server/awb-changes";
import { ModulError } from "./server/common";
import { createPodReturn, decidePodReturn } from "./server/pod-returns";
import { deleteTariff, saveTariff } from "./server/tariffs";
import { closeVendorBill, createVendorBill } from "./server/vendor-bills";

export type ModulResult = {
  ok: boolean;
  message: string;
  redirect?: string;
};

function fields(formData: FormData) {
  return Object.fromEntries(
    [...formData.entries()].filter(
      ([key, value]) =>
        typeof value === "string" && value !== "" && !key.startsWith("$"),
    ),
  );
}

function failure(e: unknown): ModulResult {
  if (e instanceof ModulError) return { ok: false, message: e.message };
  if (e instanceof IdentityError)
    return {
      ok: false,
      message:
        e.code === "UNAUTHENTICATED"
          ? "Sesi Anda berakhir. Silakan masuk kembali."
          : "Anda tidak memiliki hak akses untuk tindakan ini. Minta admin menambahkan hak tersebut.",
    };
  if (e instanceof ZodError)
    return {
      ok: false,
      message: `Isian belum valid: ${e.issues[0]?.message ?? "periksa kembali form"}`,
    };
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
    return {
      ok: false,
      message: "Nomor dokumen bentrok dengan data lain. Coba simpan lagi.",
    };
  console.error("modul action failed", e instanceof Error ? e.name : "unknown");
  return {
    ok: false,
    message:
      "Belum tersimpan karena kesalahan sistem. Coba lagi; jika berulang, hubungi admin.",
  };
}

async function run(
  work: (actor: AccessActor) => Promise<ModulResult>,
  paths: string[],
): Promise<ModulResult> {
  try {
    const current = await currentIdentity();
    if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
    const result = await work(current.actor);
    for (const path of paths) revalidatePath(path);
    return result;
  } catch (e) {
    return failure(e);
  }
}

const AWB_PATHS = ["/transactions/approvals", "/transactions"];

export async function requestAwbChangeAction(formData: FormData) {
  return run(async (actor) => {
    const data = fields(formData);
    await requestAwbChange(actor, data);
    revalidatePath(`/transactions/${data.transactionId}`);
    return { ok: true, message: "Pengajuan terkirim. Menunggu persetujuan." };
  }, AWB_PATHS);
}

export async function decideAwbChangeAction(formData: FormData) {
  return run(
    async (actor) => {
      const data = fields(formData);
      await decideAwbChange(actor, data);
      return {
        ok: true,
        message:
          data.decision === "APPROVE"
            ? "Pengajuan disetujui."
            : "Pengajuan ditolak.",
      };
    },
    [...AWB_PATHS, "/transactions/void"],
  );
}

export async function applyAwbEditAction(formData: FormData) {
  return run(async (actor) => {
    const { id } = await applyApprovedEdit(actor, fields(formData));
    revalidatePath(`/transactions/${id}`);
    return { ok: true, message: "Data AWB sudah diperbarui." };
  }, AWB_PATHS);
}

export async function saveTariffAction(formData: FormData) {
  return run(
    async (actor) => {
      await saveTariff(actor, fields(formData));
      return { ok: true, message: "Tarif tersimpan." };
    },
    ["/customer-service/cek-ongkir"],
  );
}

export async function deleteTariffAction(formData: FormData) {
  return run(
    async (actor) => {
      await deleteTariff(actor, Number(formData.get("id")));
      return { ok: true, message: "Tarif dihapus." };
    },
    ["/customer-service/cek-ongkir"],
  );
}

export async function createPodReturnAction(formData: FormData) {
  return run(
    async (actor) => {
      const created = await createPodReturn(actor, fields(formData));
      return {
        ok: true,
        message: `POD Kembali ${created.returnNo} tersimpan.`,
        redirect: `/pod-returns/${created.id}`,
      };
    },
    ["/pod-returns", "/pod-returns/approval"],
  );
}

export async function decidePodReturnAction(formData: FormData) {
  return run(
    async (actor) => {
      const data = fields(formData);
      await decidePodReturn(actor, data);
      revalidatePath(`/pod-returns/${data.id}`);
      return {
        ok: true,
        message:
          data.decision === "APPROVE"
            ? "POD Kembali disetujui."
            : "POD Kembali ditolak.",
      };
    },
    ["/pod-returns", "/pod-returns/approval"],
  );
}

export async function createVendorBillAction(formData: FormData) {
  return run(
    async (actor) => {
      await createVendorBill(actor, fields(formData));
      return { ok: true, message: "Invoice hutang tersimpan." };
    },
    ["/finance/debt-payments"],
  );
}

export async function closeVendorBillAction(formData: FormData) {
  return run(
    async (actor) => {
      await closeVendorBill(actor, Number(formData.get("id")));
      return { ok: true, message: "Invoice ditandai lunas." };
    },
    ["/finance/debt-payments"],
  );
}
