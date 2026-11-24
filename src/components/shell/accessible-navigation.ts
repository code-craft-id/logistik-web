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
  "/finance/invoices": ["invoice"],
  "/finance/accounting": [
    "finance_account",
    "journal",
    "finance_cost",
    "finance_period",
    "financial_report",
  ],
  "/finance/accounting/accounts": ["finance_account"],
  "/finance/accounting/journals": ["journal"],
  "/finance/accounting/costs": ["finance_cost"],
  "/finance/accounting/periods": ["finance_period"],
  "/finance/accounting/reports": ["financial_report"],
  "/dashboard": ["dashboard_report"],
  "/transactions": ["transaction"],
  "/transactions/new": ["transaction"],
  "/transactions/lookup": ["transaction"],
  "/transactions/void": ["transaction"],
  "/transactions/history": ["transaction"],
  "/marketing/revenue": ["customer"],
  "/bookings": ["booking"],
  "/transactions/approvals": ["awb_change"],
  "/transactions/scan": ["awb_scan"],
  "/customer-service/cek-ongkir": ["tariff"],
  "/customer-service/status-pengantaran": ["transaction"],
  "/branch-reports/rekap-transaksi": ["transaction_report"],
  "/branch-reports/rekap-transaksi-harian": ["transaction_report"],
  "/financial-reports/aging": ["invoice"],
  "/financial-reports/ap-aging": ["debt_payment"],
  "/akunting/rugi-laba": ["financial_report"],
  // Akunting following the sandbox (2026-11-24).
  "/akunting/assets": ["finance_account"],
  "/akunting/general-ledger": ["finance_account"],
  "/akunting/kategori-akun": ["finance_account"],
  "/akunting/kategori-rugi-laba": ["finance_account"],
  "/akunting/master-cashflow": ["finance_account"],
  "/akunting/master-rugi-laba": ["finance_account"],
  "/akunting/cost-centre": ["finance_account"],
  "/akunting/kategori-assets": ["finance_account"],
  "/akunting/buku-bank": ["financial_report"],
  "/akunting/kasir-penerimaan": ["journal"],
  "/akunting/kasir-penerimaan-invoice": ["journal", "invoice"],
  "/akunting/kasir-pembayaran": ["journal"],
  "/akunting/kasir-pembayaran-vendor": ["journal"],
  "/akunting/bukti-jurnal-umum": ["journal"],
  "/akunting/rekonsiliasi-bank": ["journal"],
  "/akunting/posting": ["journal"],
  "/akunting/memorial": ["journal"],
  "/akunting/penyesuaian-penjualan": ["journal"],
  "/akunting/neraca": ["financial_report"],
  "/akunting/buku-besar": ["financial_report"],
  "/akunting/neraca-saldo": ["financial_report"],
  "/pod-returns": ["pod_return"],
  "/finance/debt-payments": ["debt_payment"],
  "/manifest": ["manifest"],
  "/marketing": ["customer", "consignee"],
  "/branch-reports/awb": ["transaction_report"],
  "/customer-reports/all-status": ["transaction_report"],
  "/customer-reports/shipments": ["transaction_report"],
  "/customer-reports/pod": ["transaction_report"],
  "/branch-reports/customer-monthly-summary": ["transaction_report"],
  "/branch-reports/daily-turnover-summary": ["transaction_report"],
  "/branch-reports/inbound-transaction-details": ["transaction_report"],
  "/branch-reports/manifest-vendor": ["manifest_report"],
  "/branch-reports/gross-profit": ["financial_report"],
  "/branch-reports/rekap-gross-profit": ["financial_report"],
  "/courier-reports": ["delivery_report"],
  "/financial-reports": ["invoice"],
  "/branch-reports/manifest-outbound": ["manifest_report"],
  "/branch-reports/delivery": ["delivery_report"],
  "/branch-reports/transaction-details": ["transaction_report"],
  "/ticketting": ["ticket"],
  "/delivery-sheets": ["delivery"],
  "/vendor-processes": ["vendor_process"],
  "/branch-reports/rekap-manifest": ["manifest_report"],
  "/courier-reports/detail": ["delivery_report"],
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
    !!routeResources[href.split("?")[0]]?.some(
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
