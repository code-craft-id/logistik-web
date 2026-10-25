"use client";
import { Tabs } from "radix-ui";
import { useEffect, useState } from "react";
import {
  type ReferenceApi,
  type ReferenceCapabilities,
  ReferenceWorkspace,
} from "@/components/patterns/reference-workspace";
import { ConfigurationWorkspace } from "@/features/organization/components/configuration-workspace";
import {
  listMasterData,
  masterDataChoices,
  masterDataDetail,
  removeMasterData,
  saveMasterData,
} from "../actions";
import { masterForms } from "../contracts";
import { screens } from "../preview/screens";

const api: ReferenceApi = {
  list: listMasterData,
  detail: masterDataDetail,
  save: saveMasterData,
  remove: removeMasterData,
  choices: masterDataChoices,
};
export function VendorWorkspace({
  capabilities,
  canViewVendor,
  canViewTax,
  canViewServices = false,
  serviceCapabilities = {},
}: {
  capabilities: ReferenceCapabilities;
  canViewVendor: boolean;
  canViewTax: boolean;
  canViewServices?: boolean;
  serviceCapabilities?: ReferenceCapabilities;
}) {
  const [active, setActive] = useState("data-vendor");
  useEffect(() => {
    const update = () => {
      const hash = window.location.hash.slice(1);
      if (
        (hash === "data-vendor" && canViewVendor) ||
        (hash === "npwp" && canViewTax) ||
        (hash === "layanan-vendor" && canViewServices)
      )
        setActive(hash);
    };
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, [canViewVendor, canViewTax, canViewServices]);
  const screen = screens["/vendor"];
  const views = [
    ...screen.views.filter(
      (view) =>
        (view.id === "data-vendor" && canViewVendor) ||
        (view.id === "npwp" && canViewTax),
    ),
    ...(canViewServices
      ? [{ id: "layanan-vendor", label: "Layanan Vendor" }]
      : []),
  ];
  const selected = views.some((view) => view.id === active)
    ? active
    : views[0]?.id;
  if (!views.length) return <p>Akses ditolak. Hubungi administrator.</p>;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Data Vendor</h1>
      <Tabs.Root
        value={selected}
        onValueChange={(value) => {
          setActive(value);
          history.replaceState(null, "", `#${value}`);
        }}
      >
        <Tabs.List
          className="flex flex-wrap gap-2 border-b"
          aria-label="Data Vendor sections"
        >
          {views.map((view) => (
            <Tabs.Trigger
              key={view.id}
              value={view.id}
              className="min-h-11 border-b-2 border-transparent px-4 py-2 text-sm font-medium data-[state=active]:border-primary data-[state=active]:text-primary"
            >
              {view.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value="data-vendor" className="pt-4">
          {canViewVendor ? (
            <ReferenceWorkspace
              kind="vendor"
              definition={masterForms.vendor}
              capabilities={capabilities}
              api={api}
            />
          ) : (
            <p>Akses ditolak.</p>
          )}
        </Tabs.Content>
        <Tabs.Content value="layanan-vendor" className="pt-4">
          {canViewServices && (
            <ReferenceWorkspace
              kind="vendor_service"
              definition={masterForms.vendor_service}
              capabilities={serviceCapabilities}
              api={api}
            />
          )}
        </Tabs.Content>
        <Tabs.Content value="npwp" className="pt-4">
          {canViewTax ? (
            <ConfigurationWorkspace kind="vendor_tax" />
          ) : (
            <p>Akses ditolak.</p>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
