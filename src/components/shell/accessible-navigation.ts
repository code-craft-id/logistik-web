import {
  type AccessActor,
  isAdministrator,
  permits,
} from "@/features/identity/permissions";
import {
  isNavigationSection,
  type NavigationGroup,
  type NavigationLeaf,
  type NavigationSection,
  navigation,
  navigationEntries,
  primaryNavigation,
} from "./navigation";

// A route enters this inventory only when its workflow is implemented.
const routeResources: Record<string, readonly string[]> = {
  "/group-user": ["user_group"],
  "/user-management": ["user"],
  "/hak-akses-menu": ["permission"],
  "/office/branches": ["branch"],
  "/office/offices": ["office"],
  "/office/agents": ["agent"],
  "/office/company": [
    "company",
    "company_invoice",
    "company_bank",
    "company_wallet",
    "whatsapp_configuration",
  ],
  "/logistics/areas": [
    "province",
    "regency",
    "district",
    "village",
    "postal_code",
  ],
  "/logistics/division": ["marketing_person", "driver", "courier"],
  "/logistics/services": [
    "transport_mode",
    "service_category",
    "delivery_service",
    "goods_type",
    "cost_type",
    "term",
  ],
  "/logistics/vehicles": ["vehicle_type", "vehicle", "trucking_type"],
  "/vendor/services": ["vendor_service"],
  "/vendor": ["vendor", "vendor_tax", "vendor_service"],
  "/shipment-status": ["shipment_status"],
};

export function accessibleNavigation(
  actor: AccessActor | null,
): NavigationGroup[] {
  const showInventory = isAdministrator(actor);
  const allowed = (href?: string) =>
    !!href &&
    !!routeResources[href]?.some(
      (resource) =>
        permits(actor, "view", resource) &&
        (resource !== "vendor_tax" || isAdministrator(actor)),
    );
  const visibleLeaf = (item: NavigationLeaf): NavigationLeaf => {
    const { href, ...presentation } = item;
    return allowed(href) ? item : presentation;
  };
  return (
    showInventory ? primaryNavigation : navigation
  ).flatMap<NavigationGroup>((group) => {
    if (group.href === "/office") {
      const entries = [
        {
          label: "Perusahaan",
          providerLabel: "Perusahaan",
          href: "/office/company",
        },
        {
          label: "Kantor Cabang",
          providerLabel: "Kantor Cabang",
          href: "/office/branches",
        },
        { label: "Kantor", providerLabel: "Kantor", href: "/office/offices" },
        { label: "Agen", providerLabel: "Agen", href: "/office/agents" },
      ].filter((item) => allowed(item.href));
      return entries.length
        ? [{ label: group.label, providerLabel: group.providerLabel, entries }]
        : [];
    }
    if (group.href)
      return allowed(group.href)
        ? [group]
        : showInventory
          ? [visibleLeaf(group)]
          : [];
    if (showInventory)
      return [
        {
          ...group,
          sections: undefined,
          entries: navigationEntries(group).map((entry) =>
            isNavigationSection(entry)
              ? { ...entry, items: entry.items.map(visibleLeaf) }
              : visibleLeaf(entry),
          ),
        },
      ];
    const entries = navigationEntries(group).flatMap<
      NavigationLeaf | NavigationSection
    >((entry) => {
      if (!isNavigationSection(entry))
        return allowed(entry.href) ? [entry] : [];
      const items = entry.items.filter((item) => allowed(item.href));
      return items.length ? [{ ...entry, items }] : [];
    });
    return entries.length ? [{ ...group, sections: undefined, entries }] : [];
  });
}
