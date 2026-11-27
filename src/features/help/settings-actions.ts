"use server";

import { revalidatePath } from "next/cache";
import { currentIdentity } from "@/features/identity/server/context";
import { askHelpAi } from "./server";
import { saveHelpAiSetting } from "./settings";

export type HelpAiState = { ok: boolean; message: string };

export async function saveHelpAiAction(
  _: HelpAiState,
  form: FormData,
): Promise<HelpAiState> {
  const current = await currentIdentity();
  if (!current) return { ok: false, message: "Silakan masuk kembali." };
  const error = await saveHelpAiSetting(
    current.actor,
    current.session.user.username,
    Object.fromEntries(form),
  );
  if (error) return { ok: false, message: error };
  revalidatePath("/pengaturan-ai");
  const answer = await askHelpAi(current.actor, "Balas satu kata: siap");
  return answer
    ? { ok: true, message: "Tersimpan. AI menjawab, langsung dipakai." }
    : {
        ok: false,
        message:
          "Tersimpan, tetapi AI tidak menjawab. Periksa URL, key dan model.",
      };
}
