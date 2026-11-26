"use server";
import { revalidatePath } from "next/cache";
import { IdentityError } from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";
import { UploadError } from "@/lib/cloudinary";
import {
  addVoucherAttachment,
  removeVoucherAttachment,
} from "./server/voucher-attachments";

type Result = { ok: boolean; message: string };
async function run(
  work: () => Promise<unknown>,
  done: string,
): Promise<Result> {
  try {
    await work();
    revalidatePath("/akunting", "layout");
    return { ok: true, message: done };
  } catch (error) {
    if (error instanceof UploadError)
      return { ok: false, message: error.message };
    if (error instanceof IdentityError)
      return {
        ok: false,
        message:
          error.code === "UNAUTHENTICATED"
            ? "Sesi Anda berakhir. Silakan masuk kembali."
            : error.status === 403
              ? "Anda tidak memiliki hak membuat jurnal pada cabang ini."
              : error.message,
      };
    console.error(
      "voucher attachment failed",
      error instanceof Error ? error.name : "unknown",
    );
    return { ok: false, message: "Lampiran gagal diproses. Coba lagi." };
  }
}
async function actor() {
  const current = await currentIdentity();
  if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
  return current.actor;
}

export async function addVoucherAttachmentAction(form: FormData) {
  return run(async () => {
    const file = form.get("file");
    if (!(file instanceof File) || !file.size)
      throw new IdentityError("VALIDATION", 400, "Pilih file gambar.");
    await addVoucherAttachment(
      await actor(),
      Number(form.get("journalId")),
      file,
    );
  }, "Lampiran tersimpan.");
}

export async function removeVoucherAttachmentAction(form: FormData) {
  return run(
    async () =>
      removeVoucherAttachment(await actor(), Number(form.get("attachmentId"))),
    "Lampiran dihapus.",
  );
}
