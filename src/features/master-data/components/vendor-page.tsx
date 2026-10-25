import "server-only";
import { redirect } from "next/navigation";
import { isAdministrator, permits } from "@/features/identity/permissions";
import { currentIdentity } from "@/features/identity/server/context";
import { VendorWorkspace } from "./vendor-workspace";
export async function VendorPage() {
  const current = await currentIdentity();
  if (!current) redirect("/login");
  return (
    <VendorWorkspace
      canViewServices={permits(current.actor, "view", "vendor_service")}
      serviceCapabilities={Object.fromEntries(
        ["create", "update", "delete"].map((action) => [
          action,
          permits(current.actor, action, "vendor_service") &&
            isAdministrator(current.actor),
        ]),
      )}
      canViewVendor={permits(current.actor, "view", "vendor")}
      canViewTax={
        permits(current.actor, "view", "vendor_tax") &&
        isAdministrator(current.actor)
      }
      capabilities={Object.fromEntries(
        ["create", "update", "delete"].map((action) => [
          action,
          permits(current.actor, action, "vendor") &&
            isAdministrator(current.actor),
        ]),
      )}
    />
  );
}
