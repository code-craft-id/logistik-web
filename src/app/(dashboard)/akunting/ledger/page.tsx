import { redirect } from "next/navigation";

// Simplified chart of accounts (owner decision 2026-11-19): Ledger = an
// account without Induk; Kategori Akun, Kategori Cashflow and Perkiraan are
// managed on Akun & kategori.
export default function Page() {
  redirect("/akunting/data-akun");
}
