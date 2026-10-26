import "server-only";
import { ZodError } from "zod";
import { IdentityError } from "./access";

/** Also sanitize direct Server Action failures, not just their HTTP adapters. */
export async function identityAction<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof IdentityError) throw error;
    if (error instanceof ZodError)
      throw new IdentityError(
        "INVALID_INPUT",
        400,
        "Input tidak valid. Periksa kembali kolom dan pilihan Anda.",
      );
    const code =
      error && typeof error === "object" && "code" in error ? error.code : null;
    if (code === "P2002")
      throw new IdentityError(
        "DUPLICATE",
        409,
        "Username, email, atau nama grup sudah digunakan.",
      );
    if (code === "P2025")
      throw new IdentityError("NOT_FOUND", 404, "Data tidak ditemukan.");
    if (code === "P2003" || code === "P2034" || code === "P2010")
      throw new IdentityError(
        "CONFLICT",
        409,
        "Relasi atau data sedang berubah. Silakan coba lagi.",
      );
    throw new IdentityError(
      "INTERNAL_ERROR",
      500,
      "Permintaan tidak dapat diproses.",
    );
  }
}
