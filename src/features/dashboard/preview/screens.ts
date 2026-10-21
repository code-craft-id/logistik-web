import type { PreviewScreen } from "@/components/patterns/preview-contract";

// Source-derived UI metadata only; never consumes a DRAFT model or legacy data.
export const screens = {
  "/": {
    path: "/",
    title: "Filter",
    source: "src/pages/Dashboard.jsx",
    kind: "heading",
    integration: "Awaiting the owning PLT/domain workflow.",
    views: [],
  },
} satisfies Record<string, PreviewScreen>;
