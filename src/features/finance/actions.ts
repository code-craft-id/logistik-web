"use server";
import { revalidatePath } from "next/cache";
import { IdentityError } from "@/features/identity/server/access";
import { identityAction } from "@/features/identity/server/action";
import { financeService } from "./server/context";

/** Finance-specific wording for database conflicts; identityAction sanitizes the rest. */
async function financeErrors<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error ? error.code : null;
    if (code === "P2002")
      throw new IdentityError(
        "DUPLICATE",
        409,
        "Kode atau nomor sudah dipakai. Gunakan kode lain.",
      );
    if (code === "P2025")
      throw new IdentityError(
        "NOT_FOUND",
        404,
        "Data tidak ditemukan atau sudah berubah. Muat ulang halaman.",
      );
    throw error;
  }
}
export async function financeCommand(input: unknown) {
  try {
    const result = await identityAction(() =>
      financeErrors(() => financeService.execute(input)),
    );
    revalidatePath("/finance", "layout");
    return { ok: true as const, id: result.id };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof IdentityError
          ? error.message
          : "Belum tersimpan karena gangguan sistem. Kirim ulang tanpa mengubah isi; data tidak akan tercatat ganda.",
    };
  }
}
export async function financeOptions(branchId: unknown, search: string) {
  try {
    return {
      ok: true as const,
      data: await identityAction(() =>
        financeService.options(branchId, search),
      ),
    };
  } catch {
    return {
      ok: false as const,
      message: "Pilihan tidak tersedia. Periksa akses cabang dan coba kembali.",
    };
  }
}
