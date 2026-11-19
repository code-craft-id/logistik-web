/**
 * Browser-side photo preparation: honour EXIF orientation, scale the longest
 * side down, and encode WebP under the upload limit. Browsers that cannot
 * encode WebP fall back to JPEG; Cloudinary stores the result as WebP.
 */
const LIMIT = 900_000;

function encode(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, quality),
  );
}

export async function imageToWebp(file: File): Promise<File> {
  if (!file.type.startsWith("image/"))
    throw new Error("File yang dipilih bukan gambar.");
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  }).catch(() => {
    throw new Error("Gambar tidak bisa dibaca. Coba foto lain.");
  });
  try {
    for (const [side, quality] of [
      [1600, 0.8],
      [1280, 0.7],
      [1024, 0.6],
      [800, 0.55],
    ] as const) {
      const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas
        .getContext("2d")
        ?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      let blob = await encode(canvas, "image/webp", quality);
      if (!blob || blob.type !== "image/webp")
        blob = await encode(canvas, "image/jpeg", quality);
      if (blob && blob.size <= LIMIT) {
        const webp = blob.type === "image/webp";
        return new File([blob], webp ? "pod.webp" : "pod.jpg", {
          type: blob.type,
        });
      }
    }
  } finally {
    bitmap.close();
  }
  throw new Error("Foto terlalu besar meski sudah dikompres. Coba foto lain.");
}
