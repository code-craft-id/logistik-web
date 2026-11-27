import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageHeading } from "@/components/patterns/page-heading";
import { HelpAiForm } from "@/features/help/components/help-ai-form";
import { canManageHelpAi } from "@/features/help/settings";
import { currentIdentity } from "@/features/identity/server/context";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Pengaturan AI" };

export const instant = false;

export default async function Page() {
  const current = await currentIdentity();
  if (!current) redirect("/login");
  // Hidden page: not in any menu, and "not found" for every other account.
  if (!canManageHelpAi(current.actor, current.session.user.username))
    notFound();
  // The key itself is never sent to the browser.
  const row = await prisma.helpAiSetting.findUnique({
    where: { id: 1 },
    select: { url: true, model: true },
  });
  return (
    <div className="space-y-6 rounded-md border bg-background p-4 sm:p-6">
      <PageHeading
        title="Pengaturan AI"
        description="Penyedia AI untuk Bantuan fitur (format OpenAI chat completions). Berlaku langsung tanpa restart. Pertanyaan user, nama grup dan haknya dikirim ke penyedia ini."
      />
      <HelpAiForm
        url={row?.url ?? ""}
        model={row?.model ?? ""}
        hasKey={Boolean(row)}
      />
    </div>
  );
}
