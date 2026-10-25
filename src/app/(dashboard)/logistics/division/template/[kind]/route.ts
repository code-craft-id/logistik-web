import { IdentityError } from "@/features/identity/server/access";
import { identityAction } from "@/features/identity/server/action";
import { currentIdentity } from "@/features/identity/server/context";
import {
  personnelImportDefinitions,
  personnelImportKind,
} from "@/features/master-data/personnel-import-contracts";
import { createPersonnelImportService } from "@/features/master-data/server/personnel-import-service";
import { prisma } from "@/lib/db";
export async function GET(
  _request: Request,
  context: { params: Promise<{ kind: string }> },
) {
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };
  try {
    const artifact = await identityAction(async () => {
      const kind = personnelImportKind.parse((await context.params).kind);
      const service = createPersonnelImportService(
        prisma,
        async () => (await currentIdentity())?.actor ?? null,
      );
      return {
        bytes: await service.template(kind),
        name: personnelImportDefinitions[kind].filename,
      };
    });
    return new Response(new Uint8Array(artifact.bytes), {
      headers: {
        ...headers,
        "Content-Type": "application/vnd.ms-excel",
        "Content-Disposition": `attachment; filename="${artifact.name}"`,
      },
    });
  } catch (error) {
    return Response.json(
      {
        message:
          error instanceof IdentityError
            ? error.message
            : "Template tidak dapat diunduh.",
      },
      { status: error instanceof IdentityError ? error.status : 500, headers },
    );
  }
}
