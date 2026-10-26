/** Inline images stay in the existing text column; no public upload directory. */
export const COMPANY_LOGO_MAX_BYTES = 250 * 1024;
export function validCompanyLogo(value: string | null): boolean {
  if (value === null || !value.startsWith("data:"))
    return value === null || value.length <= 1000;
  const match =
    /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match || match[2].length % 4 !== 0) return false;
  const payload = match[2];
  const bytes =
    (payload.length / 4) * 3 -
    (payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0);
  if (bytes > COMPANY_LOGO_MAX_BYTES) return false;
  try {
    const prefix = atob(payload.slice(0, 64));
    return match[1] === "png"
      ? prefix.startsWith("\x89PNG\r\n\x1a\n")
      : match[1] === "jpeg"
        ? prefix.startsWith("\xff\xd8\xff")
        : prefix.startsWith("RIFF") && prefix.slice(8, 12) === "WEBP";
  } catch {
    return false;
  }
}
