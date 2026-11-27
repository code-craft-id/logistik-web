"use server";
import { revalidatePath } from "next/cache";
import { IdentityError } from "@/features/identity/server/access";
import { identityAction } from "@/features/identity/server/action";
import { currentIdentity } from "@/features/identity/server/context";
import {
  ACCOUNT_IMPORT_MAX_BYTES,
  importAccounts,
} from "./server/account-excel";
import { importAssets } from "./server/asset-import";
import { importCashPayments } from "./server/cash-import";

/** Reads the upload (.xlsx / .xls up to 1 MB) for an all-or-nothing import. */
async function runImport(
  form: FormData,
  path: string,
  work: (
    actor: Parameters<typeof importAccounts>[0],
    bytes: Uint8Array,
  ) => Promise<string>,
) {
  try {
    const message = await identityAction(async () => {
      const current = await currentIdentity();
      if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
      const file = form.get("file");
      if (
        !(file instanceof File) ||
        !/\.xlsx?$/i.test(file.name) ||
        !file.size ||
        file.size > ACCOUNT_IMPORT_MAX_BYTES
      )
        throw new IdentityError(
          "INVALID_IMPORT",
          400,
          "Pilih file .xlsx atau .xls maksimal 1 MB.",
        );
      return work(current.actor, new Uint8Array(await file.arrayBuffer()));
    });
    revalidatePath(path);
    return { ok: true as const, message };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof IdentityError
          ? error.message
          : "Import tidak dapat diproses.",
    };
  }
}

export async function importAccountsAction(form: FormData) {
  return runImport(form, "/akunting/data-akun", async (actor, bytes) => {
    const result = await importAccounts(actor, bytes);
    return `${result.created} akun baru, ${result.updated} akun diperbarui.`;
  });
}

export async function importAssetsAction(form: FormData) {
  return runImport(form, "/akunting/assets", async (actor, bytes) => {
    const result = await importAssets(actor, bytes);
    return `${result.created} aset baru.`;
  });
}

export async function importCashPaymentsAction(form: FormData) {
  return runImport(form, "/akunting/kasir-pembayaran", async (actor, bytes) => {
    const branchId = Number(form.get("branchId"));
    if (!Number.isSafeInteger(branchId) || branchId <= 0)
      throw new IdentityError("INVALID_IMPORT", 400, "Pilih cabang.");
    const result = await importCashPayments(actor, branchId, bytes);
    return `${result.created} bukti draft dibuat. Periksa lalu Posting.`;
  });
}
