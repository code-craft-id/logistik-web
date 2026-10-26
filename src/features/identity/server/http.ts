import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { IdentityError } from "./access";

function privateJson(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function identityResponse(
  work: () => Promise<unknown>,
  status = 200,
) {
  try {
    return privateJson(await work(), status);
  } catch (error) {
    if (error instanceof IdentityError)
      return privateJson(
        { code: error.code, message: error.message },
        error.status,
      );
    if (error instanceof ZodError || error instanceof SyntaxError)
      return privateJson(
        { message: "Input tidak valid. Periksa kolom dan pilihan Anda." },
        400,
      );
    const code =
      error && typeof error === "object" && "code" in error ? error.code : null;
    if (code === "P2002")
      return privateJson(
        { message: "Username, email, atau nama grup sudah digunakan." },
        409,
      );
    if (code === "P2025")
      return privateJson({ message: "Data tidak ditemukan." }, 404);
    if (code === "P2003")
      return privateJson(
        { message: "Relasi tidak valid atau data masih digunakan." },
        409,
      );
    if (code === "P2034" || code === "P2010")
      return privateJson(
        { message: "Data sedang berubah. Silakan coba lagi." },
        409,
      );
    // Never expose Prisma messages, SQL, contact details or credentials.
    return privateJson({ message: "Permintaan tidak dapat diproses." }, 500);
  }
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    throw new IdentityError(
      "INVALID_ORIGIN",
      403,
      "Asal permintaan tidak diizinkan.",
    );
  }
}
