"use server";

import { revalidatePath } from "next/cache";
import { IdentityError } from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";
import { destroyImage, UploadError, uploadWebp } from "@/lib/cloudinary";
import { awbScanEnabled } from "@/lib/features";
import { signUpload, verifyUpload } from "@/lib/upload-token";
import { ModulError } from "./server/common";
import {
  assertProofAllowed,
  awbForScan,
  recordProof,
  type ScanAwbView,
  scanLookup,
} from "./server/proof";

type Fail = { ok: false; message: string };
const fail = (e: unknown): Fail => {
  if (e instanceof ModulError || e instanceof UploadError)
    return { ok: false, message: e.message };
  if (e instanceof IdentityError)
    return {
      ok: false,
      message:
        e.code === "UNAUTHENTICATED"
          ? "Sesi Anda berakhir. Silakan masuk kembali."
          : "Grup Anda belum memiliki hak Scan AWB. Minta admin menambahkannya di Hak Akses Menu.",
    };
  console.error(
    "scan proof action failed",
    e instanceof Error ? e.name : "unknown",
  );
  return { ok: false, message: "Terjadi kesalahan sistem. Coba lagi." };
};

async function actor() {
  if (!awbScanEnabled())
    throw new ModulError("Fitur Scan AWB belum diaktifkan.");
  const current = await currentIdentity();
  if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
  return current.actor;
}

export async function scanLookupAction(
  awbNo: string,
): Promise<{ ok: true; awb: ScanAwbView } | Fail> {
  try {
    return {
      ok: true,
      awb: await scanLookup(await actor(), String(awbNo ?? "")),
    };
  } catch (e) {
    return fail(e);
  }
}

/** Upload one photo or the signature after access checks; returns a token. */
export async function uploadProofImageAction(
  formData: FormData,
): Promise<{ ok: true; url: string; publicId: string; token: string } | Fail> {
  try {
    const current = await actor();
    const transactionId = Number(formData.get("transactionId"));
    const outcome =
      formData.get("outcome") === "RETURNED" ? "RETURNED" : "DELIVERED";
    const file = formData.get("file");
    if (!Number.isSafeInteger(transactionId) || transactionId <= 0)
      throw new ModulError("Data AWB tidak valid. Scan ulang.");
    if (!(file instanceof File) || file.size === 0)
      throw new ModulError("File gambar kosong.");
    // Access, branch scope and status are checked before using the quota.
    await assertProofAllowed(current, transactionId, outcome);
    const image = await uploadWebp(file);
    return {
      ...image,
      ok: true,
      token: signUpload({ actorId: current.id, transactionId, ...image }),
    };
  } catch (e) {
    return fail(e);
  }
}

type SignedImage = { url: string; publicId: string; token: string };

export async function recordProofAction(input: {
  transactionId: number;
  outcome: string;
  receiverName?: string;
  notes?: string;
  photos?: SignedImage[];
  signature?: SignedImage | null;
}): Promise<{ ok: true; awb: ScanAwbView } | Fail> {
  const images = [
    ...(input?.photos ?? []),
    ...(input?.signature ? [input.signature] : []),
  ];
  // Only images whose token proves this server uploaded them for this user
  // and AWB may be saved, or deleted again on failure.
  const verified: SignedImage[] = [];
  try {
    const current = await actor();
    const transactionId = Number(input?.transactionId);
    for (const image of images) {
      const ok =
        !!image &&
        typeof image.url === "string" &&
        typeof image.publicId === "string" &&
        verifyUpload(
          {
            actorId: current.id,
            transactionId,
            url: image.url,
            publicId: image.publicId,
          },
          String(image.token),
        );
      if (!ok)
        throw new ModulError(
          "Foto tidak valid atau kedaluwarsa. Ambil ulang fotonya.",
        );
      verified.push(image);
    }
    const strip = (i: SignedImage) => ({ url: i.url, publicId: i.publicId });
    await recordProof(
      current,
      {
        transactionId,
        outcome: input.outcome,
        receiverName: input.receiverName,
        notes: input.notes,
      },
      {
        photos: (input.photos ?? []).map(strip),
        signature: input.signature ? strip(input.signature) : undefined,
      },
    );
    revalidatePath(`/transactions/${transactionId}`);
    return { ok: true, awb: await awbForScan(current, transactionId) };
  } catch (e) {
    // Do not leave our uploaded images behind when the proof was not saved.
    await Promise.all(verified.map((i) => destroyImage(i.publicId)));
    return fail(e);
  }
}
