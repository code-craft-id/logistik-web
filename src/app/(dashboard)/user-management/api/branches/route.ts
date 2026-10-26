import { identityResponse } from "@/features/identity/server/http";
import { getBranchesForAssignment } from "../../actions";
export async function GET(request: Request) {
  return identityResponse(() =>
    getBranchesForAssignment(
      Object.fromEntries(new URL(request.url).searchParams),
    ),
  );
}
