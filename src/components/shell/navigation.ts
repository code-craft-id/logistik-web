import { implementedPreviewRoutes } from "./implemented-preview-routes";
import { legacyMenu } from "./legacy-menu";

export type NavigationLeaf = {
  label: string;
  providerLabel: string;
  href?: string;
};
export type NavigationSection = {
  label: string;
  providerPath: readonly string[];
  items: readonly NavigationLeaf[];
};
export type NavigationGroup = NavigationLeaf & {
  sections?: readonly NavigationSection[];
  entries?: readonly (NavigationLeaf | NavigationSection)[];
};

// Provisional English presentation; D-19 remains unresolved. No permissions implied.
const leaves = (
  pairs: readonly (readonly [string, string])[],
): NavigationLeaf[] =>
  pairs.map(([label, providerLabel]) => ({ label, providerLabel }));

export const providerNavigation: readonly NavigationGroup[] = [
  { label: "Dashboard", providerLabel: "Dashboard", href: DASHBOARD_PATH },
  { label: "System Settings", providerLabel: "Sistem Seting" },
  { label: "Office", providerLabel: "Kantor" },
  {
    label: "Master Data",
    providerLabel: "Master Data",
    sections: [
      {
        label: "Logistics / Areas",
        providerPath: ["M. Logistik", "Area Logistik"],
        items: leaves([
          ["Provinces", "Provinsi"],
          ["Regencies", "Kabupaten"],
          ["Districts", "Kecamatan"],
          ["Villages", "Kelurahan"],
          ["Postal codes", "Kode Pos"],
        ]),
      },
      {
        label: "Logistics / Divisions",
        providerPath: ["M. Logistik", "Divisi Logistik"],
        items: leaves([
          ["Marketing", "Pemasaran"],
          ["Drivers", "Driver"],
          ["Couriers", "Kurir"],
        ]),
      },
      {
        label: "Logistics / Services",
        providerPath: ["M. Logistik", "Layanan Logistik"],
        items: leaves([
          ["Transport modes", "Moda"],
          ["Service categories", "Kategori Layanan"],
          ["Delivery services", "Layanan Pengantaran"],
          ["Goods types", "Jenis Barang"],
          ["Cost types", "Jenis Biaya"],
          ["Terms", "Termin"],
        ]),
      },
      {
        label: "Logistics / Vehicles",
        providerPath: ["M. Logistik", "Kendaraan Logistik"],
        items: leaves([
          ["Vehicle types", "Jenis Kendaraan"],
          ["Vehicles", "Kendaraan"],
          ["Trucking types", "Jenis Trucking"],
        ]),
      },
      {
        label: "Vendors",
        providerPath: ["M. Vendor"],
        items: leaves([
          ["Vendors", "Vendor"],
          ["Vendor services", "Layanaan Vendor"],
        ]),
      },
      {
        label: "Shipment status",
        providerPath: ["M. Shipment Status"],
        items: leaves([["Shipment status definitions", "M. Shipment Status"]]),
      },
    ],
  },
  {
    label: "Modules",
    providerLabel: "Modul",
    sections: [
      {
        label: "Marketing / Sales",
        providerPath: ["Pemasaran/Penjualan"],
        items: leaves([
          ["Customers", "Customer"],
          ["Consignees", "Penerima"],
          ["Customer revenue", "Pendapatan Pelanggan"],
        ]),
      },
      {
        label: "Customer Service / Transactions",
        providerPath: ["Layanan Pelanggan", "Transaksi"],
        items: leaves([
          ["Onsite Outbound", "Onsite Outbound"],
          ["Onsite Inbound", "Onsite Inbound"],
          ["Print AWB", "Print AWB"],
          ["Approve AWB edits / deletion", "Persetujuaan Edit/Delete AWB"],
          ["Void AWB", "Void AWB"],
        ]),
      },
      {
        label: "Customer Service",
        providerPath: ["Layanan Pelanggan"],
        items: leaves([
          ["Delivery status", "Status Pengantaran"],
          ["Check shipping rates", "Cek Ongkir"],
          ["Track AWB", "Cek Resi"],
          ["AWB edit history", "Histori Edit Resi"],
          ["Booking", "Booking"],
          ["Inbound booking", "Inbound Booking"],
          ["AWB deletion history", "History Delete Resi"],
        ]),
      },
      {
        label: "Operations / Manifests",
        providerPath: ["Operasional", "Manifest"],
        items: leaves([
          ["Check transit", "Cek Transit"],
          ["Check inbound", "Cek Inbound"],
          ["Check agent inbound", "Cek Inbound Agen"],
          ["Print manifest", "Print Manifest"],
        ]),
      },
      {
        label: "Operations / Delivery sheets",
        providerPath: ["Operasional", "Lembar Pengantaran"],
        items: leaves([
          ["City couriers", "Kurir Kota"],
          ["Print DRS", "Print DRS"],
        ]),
      },
      {
        label: "Operations",
        providerPath: ["Operasional"],
        items: leaves([
          ["POD returns", "POD Kembali"],
          ["Approve POD returns", "Approval POD Kembali"],
          ["Vendor processing", "Proses Vendor"],
        ]),
      },
      {
        label: "Finance / Trade receivables",
        providerPath: ["Keuangan", "Piutang Dagang"],
        items: leaves([["Invoice (new)", "Invoice (new)"]]),
      },
      {
        label: "Finance / Trade payables",
        providerPath: ["Keuangan", "Hutang Dagang"],
        items: leaves([["Payables payments", "Pembayaran Hutang"]]),
      },
    ],
  },
  {
    label: "Reports",
    providerLabel: "Laporan-laporan",
    sections: [
      {
        label: "Branch reports",
        providerPath: ["Laporan Cabang"],
        items: leaves([
          ["Transaction detail", "Detail Transaksi"],
          ["Transaction summary", "Rekap Transaksi"],
          ["Outbound manifest", "Manifest Outbound"],
          ["Manifest summary", "Rekap Manifest"],
          ["Delivery", "Pengantaran"],
          ["Gross profit / manifest", "Gross Profit / Manifest"],
          ["Daily transaction summary", "Rekap Transaksi Harian"],
          ["Gross profit summary", "Rekap Gross Profit"],
          ["Vendor manifest", "Manifest Vendor"],
          ["Pending AWB", "AWB Tertunda"],
          ["Manifested AWB", "AWB Termanifest"],
          ["Monthly customer summary", "Rekap Customer Bulanan"],
          ["Daily turnover summary", "Rekap Omset Harian"],
          ["Inbound transaction detail", "Detail Transaction Inbound"],
        ]),
      },
      {
        label: "Courier reports",
        providerPath: ["Laporan Kurir"],
        items: leaves([
          ["Daily courier report", "Harian Kurir"],
          ["Courier detail report", "Laporan Detail Kurir"],
        ]),
      },
      {
        label: "Financial reports",
        providerPath: ["Laporan Keuangan"],
        items: leaves([
          ["AR report", "Laporan AR"],
          ["AP report", "Laporan AP"],
        ]),
      },
      {
        label: "Customer reports",
        providerPath: ["Reports Customer"],
        items: leaves([
          ["Shipments", "Pengiriman"],
          ["POD returns", "POD Kembali"],
          ["All statuses", "Semua Status"],
        ]),
      },
      {
        label: "Customer report",
        providerPath: ["Report Customer"],
        items: leaves([["Customer report", "Report Customer"]]),
      },
    ],
  },
  { label: "Ticketing", providerLabel: "Ticketing" },
  { label: "System Tutorial", providerLabel: "Tutorial System" },
  {
    label: "UI examples",
    providerLabel: "Local foundation example",
    href: "/ui-examples",
  },
];

type LegacyItem = {
  label: string;
  href?: string;
  children?: readonly LegacyItem[];
};
const implemented = new Set<string>(
  implementedPreviewRoutes.map((item) => item.href),
);
const leaf = (item: LegacyItem): NavigationLeaf => {
  const href = item.href ? applicationPreviewPath(item.href) : undefined;
  return {
    label: item.label,
    providerLabel: item.label,
    ...(href && implemented.has(href) ? { href } : {}),
  };
};
export const navigation: readonly NavigationGroup[] = [
  ...legacyMenu.map(
    (item: LegacyItem): NavigationGroup => ({
      ...leaf(item),
      ...(item.children
        ? {
            entries: item.children.map((child) =>
              child.children
                ? {
                    label: child.label,
                    providerPath: [child.label],
                    items: child.children.map(leaf),
                  }
                : leaf(child),
            ),
          }
        : {}),
    }),
  ),
  {
    label: "More previews",
    providerLabel: "More previews",
    entries: implementedPreviewRoutes
      .filter(
        (item) =>
          !legacyMenu.some(
            (group: LegacyItem) =>
              (group.href &&
                applicationPreviewPath(group.href) === item.href) ||
              group.children?.some(
                (child) =>
                  child.href === item.href ||
                  child.children?.some(
                    (grandchild) => grandchild.href === item.href,
                  ),
              ),
          ),
      )
      .map((item) => ({
        label: item.label,
        providerLabel: item.label,
        href: item.href,
      })),
  },
  {
    label: "Provider inventory",
    providerLabel: "Provider inventory",
    sections: providerNavigation.flatMap(
      (group) =>
        group.sections?.map((section) => ({
          ...section,
          label: `${group.label} / ${section.label}`,
          providerPath: [group.providerLabel, ...section.providerPath],
        })) ?? [],
    ),
  },
  { label: "System Tutorial", providerLabel: "Tutorial System" },
  {
    label: "UI examples",
    providerLabel: "Local foundation example",
    href: "/ui-examples",
  },
];

// Both surfaces derive their partition from the verified inventory, never a
// second handwritten menu. Supplemental material keeps its own identity.
export const primaryNavigation = navigation.slice(0, legacyMenu.length);
export const supplementaryNavigation = navigation.slice(legacyMenu.length);

export function navigationEntries(group: NavigationGroup) {
  return group.entries ?? group.sections ?? [];
}
export function isNavigationSection(
  entry: NavigationLeaf | NavigationSection,
): entry is NavigationSection {
  return "items" in entry;
}
export function navigationDestinations(
  groups: readonly NavigationGroup[] = navigation,
) {
  return groups.flatMap((group) => [
    ...(group.href || !navigationEntries(group).length
      ? [
          {
            item: group as NavigationLeaf,
            path: group.providerLabel,
            searchLabels: [group.label],
          },
        ]
      : []),
    ...navigationEntries(group).flatMap((entry) =>
      isNavigationSection(entry)
        ? entry.items.map((item) => ({
            item,
            path: [group.providerLabel, ...entry.providerPath].join(" / "),
            searchLabels: [group.label, entry.label],
          }))
        : [
            {
              item: entry,
              path: group.providerLabel,
              searchLabels: [group.label],
            },
          ],
    ),
  ]);
}
export const foundationRoutes = navigationDestinations()
  .filter(({ item }) => item.href)
  .map(({ item }) => item);
export function activeFoundationRoute(pathname: string) {
  return foundationRoutes.find((route) => route.href === pathname);
}

export function navigationPath(
  pathname: string,
  groups: readonly NavigationGroup[] = navigation,
) {
  for (const group of groups) {
    if (group.href === pathname) return { group, labels: [group.label] };
    for (const entry of navigationEntries(group)) {
      if (!isNavigationSection(entry)) {
        if (entry.href === pathname)
          return { group, labels: [group.providerLabel, entry.providerLabel] };
        continue;
      }
      const section = entry;
      const leaf = section.items.find((item) => item.href === pathname);
      if (leaf)
        return {
          group,
          section,
          labels: [
            group.providerLabel,
            ...section.providerPath,
            leaf.providerLabel,
          ],
        };
    }
  }
}

import { applicationPreviewPath, DASHBOARD_PATH } from "@/lib/routes";
