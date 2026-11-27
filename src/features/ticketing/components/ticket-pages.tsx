import "server-only";
import { randomUUID } from "node:crypto";
import { notFound, redirect } from "next/navigation";
import { ErrorState } from "@/components/patterns/content-state";
import { permits } from "@/features/identity/permissions";
import { currentIdentity } from "@/features/identity/server/context";
import { ticketId, ticketListInput } from "../contracts";
import { ticketService } from "../server/context";
import { TicketForm } from "./ticket-form";
import { TicketDetail, TicketList } from "./ticket-views";

async function entry(action: "view" | "create") {
  const current = await currentIdentity();
  if (!current) redirect("/login");
  return permits(current.actor, action, "ticket") ? current.actor : null;
}
const denied = (
  <ErrorState
    title="Akses ditolak"
    description="Anda tidak memiliki hak akses tiket ini. Hubungi administrator."
  />
);
export async function TicketListPage({
  query,
}: {
  query: Record<string, string | string[] | undefined>;
}) {
  const actor = await entry("view");
  if (!actor) return denied;
  const parsed = ticketListInput.safeParse(query);
  if (!parsed.success)
    return (
      <ErrorState
        title="Pencarian tidak valid"
        description="Gunakan pencarian maksimal 100 karakter dan nomor halaman yang valid."
        action={
          <a
            className="text-primary underline underline-offset-4"
            href="/ticketting"
          >
            Kembali ke daftar
          </a>
        }
      />
    );
  const result = await ticketService.list(parsed.data);
  return (
    <TicketList {...result} canCreate={permits(actor, "create", "ticket")} />
  );
}
export async function TicketCreatePage() {
  const actor = await entry("create");
  if (!actor) return denied;
  const branches = await ticketService.branches();
  return (
    <div className="min-w-0 space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Buat tiket
        </h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Pilih cabang dan prioritas, lalu jelaskan kendala Anda. Judul, menu,
          URL, cabang dan prioritas wajib diisi.
        </p>
      </div>
      <div className="rounded-lg border bg-background p-4 sm:p-6">
        <TicketForm
          branches={branches}
          idempotencyKey={randomUUID()}
          canView={permits(actor, "view", "ticket")}
        />
      </div>
    </div>
  );
}
export async function TicketDetailPage({ id }: { id: string }) {
  const actor = await entry("view");
  if (!actor) return denied;
  const parsed = ticketId.safeParse(id);
  if (!parsed.success) notFound();
  const ticket = await ticketService.detail(parsed.data);
  if (!ticket) notFound();
  return (
    <TicketDetail
      ticket={ticket}
      canManage={permits(actor, "manage", "ticket")}
      isCreator={ticket.createdById === actor.id}
    />
  );
}
