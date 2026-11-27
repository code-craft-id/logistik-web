"use server";
import { revalidatePath } from "next/cache";
import {
  assertPermission,
  IdentityError,
} from "@/features/identity/server/access";
import { identityAction } from "@/features/identity/server/action";
import { currentIdentity } from "@/features/identity/server/context";
import { ticketService } from "./server/context";

async function ticketAction(work: () => Promise<{ id: number }>) {
  try {
    const { id } = await identityAction(work);
    revalidatePath("/ticketting");
    revalidatePath(`/ticketting/${id}`);
    return { ok: true as const, message: "Tiket diperbarui." };
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

const formFields = (formData: FormData) =>
  Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string"),
  );

export async function setTicketStatusAction(formData: FormData) {
  return ticketAction(() => ticketService.setStatus(formFields(formData)));
}

export async function decideTicketAction(formData: FormData) {
  return ticketAction(() => ticketService.decide(formFields(formData)));
}

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
