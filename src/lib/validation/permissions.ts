import { permissionResources } from "@/features/identity/permissions";
export const RESOURCE_ACTIONS = Object.fromEntries(
  permissionResources.map(({ resource, actions }) => [resource, actions]),
);
export type ResourceKey = (typeof permissionResources)[number]["resource"];
export type ActionKey = (typeof permissionResources)[number]["actions"][number];
