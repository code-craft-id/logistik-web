import "server-only";
import { redirect } from "next/navigation";
import { permits } from "@/features/identity/permissions";
import { currentIdentity } from "@/features/identity/server/context";
import type { OrganizationKind } from "../contracts";
import { OrganizationWorkspace } from "./organization-workspace";
export async function OrganizationPage({
  section,
}: {
  section?: OrganizationKind;
}) {
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const resources = [
    "company",
    "office",
    "branch",
    "agent",
    "company_invoice",
    "company_bank",
    "company_wallet",
    "whatsapp_configuration",
  ].filter((resource) => permits(current.actor, "view", resource));
  const allowed =
    section === "company"
      ? resources.some(
          (resource) =>
            resource === "company" ||
            resource.startsWith("company_") ||
            resource === "whatsapp_configuration",
        )
      : section
        ? resources.includes(section)
        : resources.length > 0;
  if (!allowed) return <p>Akses ditolak. Hubungi administrator.</p>;
  return (
    <OrganizationWorkspace
      resources={resources}
      section={
        section ??
        (resources.some(
          (resource) =>
            resource === "company" ||
            resource.startsWith("company_") ||
            resource === "whatsapp_configuration",
        )
          ? "company"
          : (resources.find((resource) =>
              ["office", "branch", "agent"].includes(resource),
            ) as OrganizationKind))
      }
    />
  );
}
