import type { ZodError } from "zod";
import { IdentityError } from "./access";

const labels: Record<string, string> = {
  name: "Nama",
  username: "Username",
  email: "Email",
  password: "Password",
  groupId: "Grup User",
  branchIds: "Cabang",
  status: "Status",
  description: "Deskripsi",
};

/** Validation failure naming each wrong field, in Indonesian. */
export function inputError(error: ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (!labels[key] || fields[key]) continue;
    // Zod's own texts are English; only our schema messages are shown.
    fields[key] = /^(Invalid|Too |Unrecognized)/.test(issue.message)
      ? `${labels[key]} belum diisi dengan benar`
      : issue.message;
  }
  const list = Object.values(fields);
  return new IdentityError(
    "INVALID_INPUT",
    400,
    list.length
      ? `${list.join(". ")}.`
      : "Input tidak valid. Periksa kembali kolom dan pilihan Anda.",
    list.length ? fields : undefined,
  );
}
