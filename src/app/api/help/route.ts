import { askHelpAi } from "@/features/help/server";
import { currentIdentity } from "@/features/identity/server/context";

// A route handler, not a Server Action: actions run one at a time, so a slow
// AI reply would delay the user's saves.
// shortcut: no per-user rate limit; add one if AI cost becomes a concern.
export async function POST(request: Request) {
  const current = await currentIdentity();
  if (!current)
    return Response.json(
      { message: "Silakan masuk kembali." },
      { status: 401 },
    );
  const body = await request.json().catch(() => null);
  const question =
    typeof body?.question === "string"
      ? body.question.trim().slice(0, 300)
      : "";
  const answer = question ? await askHelpAi(current.actor, question) : null;
  return Response.json(
    { answer },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
