"use server";
import { revalidatePath } from "next/cache";
import {
  assertPermission,
  IdentityError,
} from "@/features/identity/server/access";
import { identityAction } from "@/features/identity/server/action";
import { currentIdentity } from "@/features/identity/server/context";
import { ticketService } from "./server/context";

export async function createTicket(input: unknown) {
  try {
    const ticket = await identityAction(async () => {
      const current = await currentIdentity();
      assertPermission(current?.actor ?? null, "create", "ticket");
      return ticketService.create(input);
    });
    revalidatePath("/ticketting");
    return { ok: true as const, id: ticket.id };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof IdentityError
          ? error.message
          : "Tiket belum tersimpan. Coba kembali.",
    };
  }
}
