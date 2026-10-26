import { identityResponse } from "@/features/identity/server/http";
import { getGroupsForAssignment } from "../../actions";
export async function GET(request: Request) {
  return identityResponse(() =>
    getGroupsForAssignment(
      Object.fromEntries(new URL(request.url).searchParams),
    ),
  );
}
