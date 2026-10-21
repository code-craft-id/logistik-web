/** Presentation contracts only. Never use these as database/API/permission types. */
export type PreviewField = {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: readonly string[];
  group?: string;
  table?: boolean;
};
export type PreviewColumn = { key: string; label: string; type?: string };
export type PreviewView = {
  id: string;
  label: string;
  columns: readonly PreviewColumn[];
  fields: readonly PreviewField[];
  filters?: readonly PreviewField[];
  children?: readonly PreviewView[];
  formGroups?: readonly string[];
  actions?: readonly string[];
  tools?: readonly string[];
  inlineForm?: boolean;
  summaries?: readonly string[];
};
export type PreviewScreen = {
  path: string;
  title: string;
  source: string;
  kind: "workspace" | "heading" | "index";
  integration: string;
  views: readonly PreviewView[];
  links?: readonly { label: string; href: string }[];
};
