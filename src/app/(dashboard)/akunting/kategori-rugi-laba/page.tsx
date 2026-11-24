import { redirect } from "next/navigation";

// Simplified chart of accounts (owner decision 2026-11-19): Kategori Akun,
// Master Arus Kas and Kategori Rugi Laba are managed on Data Akun.
export default function Page() {
  redirect("/finance/accounting/accounts#kategori-rugi-laba");
}
