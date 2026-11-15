"use server";
import { revalidatePath } from "next/cache";
import { IdentityError } from "@/features/identity/server/access";
import { identityAction } from "@/features/identity/server/action";
import { financeService } from "./server/context";

export async function financeCommand(input: unknown) {
  try {
    const result = await identityAction(() => financeService.execute(input));
    revalidatePath("/finance", "layout");
    return { ok: true as const, id: result.id };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof IdentityError
          ? error.message
          : "Belum tersimpan. Coba kembali dengan isi yang sama.",
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
