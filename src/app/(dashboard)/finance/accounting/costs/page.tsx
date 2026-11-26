import { redirect } from "next/navigation";

// Moved under Akunting (user 2026-11-27); old links keep working.
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams))
    for (const v of Array.isArray(value) ? value : value ? [value] : [])
      query.append(key, v);
  redirect(`/akunting/biaya-aktual${query.size ? `?${query}` : ""}`);
}
