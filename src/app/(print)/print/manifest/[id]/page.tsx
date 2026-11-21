import { redirect } from "next/navigation";

// Request-dependent redirect; never prerendered.
export const instant = false;

/** Single-manifest print links share the multi-document print tab. */
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const doc = (await searchParams).doc === "drs" ? "&doc=drs" : "";
  redirect(`/print/manifests?ids=${encodeURIComponent(id)}${doc}`);
}
