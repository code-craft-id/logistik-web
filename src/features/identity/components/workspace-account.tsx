import "server-only";
import { redirect } from "next/navigation";
import { isAdministrator } from "../permissions";
import { currentIdentity } from "../server/context";
import { AccountMenuContent } from "./account-menu-content";

export async function WorkspaceAccount() {
  const current = await currentIdentity();
  if (!current) redirect("/login");

  // Pass only display fields, never the session token, contacts, or credential data.
  return (
    <AccountMenuContent
      account={{
        name: current.session.user.name,
        username: current.session.user.username ?? null,
        groupName: current.actor.group?.name ?? "",
        fullAccess: isAdministrator(current.actor),
      }}
    />
  );
}
