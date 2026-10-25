"use server";
import { revalidatePath } from "next/cache";
import { IdentityError } from "@/features/identity/server/access";
import { identityAction } from "@/features/identity/server/action";
import { currentIdentity } from "@/features/identity/server/context";
import { prisma } from "@/lib/db";
import { PERSONNEL_IMPORT_MAX_BYTES } from "./personnel-import-contracts";
import { createPersonnelImportService } from "./server/personnel-import-service";

const service = createPersonnelImportService(
  prisma,
  async () => (await currentIdentity())?.actor ?? null,
);
async function upload(form: FormData) {
  const file = form.get("file");
  if (
    !(file instanceof File) ||
    !file.name.toLowerCase().endsWith(".xls") ||
    file.size > PERSONNEL_IMPORT_MAX_BYTES ||
    !file.size
  )
    throw new IdentityError(
      "INVALID_IMPORT",
      400,
      "Pilih file .xls berukuran maksimal 512 KB.",
    );
  return new Uint8Array(await file.arrayBuffer());
}
async function result<T>(work: () => Promise<T>) {
  try {
    return { ok: true as const, data: await identityAction(work) };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof IdentityError
          ? error.message
          : "Impor tidak dapat diproses.",
    };
  }
}
export async function previewPersonnelImport(kind: unknown, form: FormData) {
  return result(async () => service.preview(kind, await upload(form)));
}
export async function commitPersonnelImport(kind: unknown, form: FormData) {
  return result(async () => {
    const response = await service.import(kind, await upload(form));
    revalidatePath("/logistics/division");
    return response;
  });
}
