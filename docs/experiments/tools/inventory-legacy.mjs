// Read-only AST inventory. Never imports or executes legacy application code.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const { parse } = require("next/dist/compiled/babel/bundle").parser();
const root = "C:/Development/backup/logistik-web/frontend";
const destination = "docs/experiments/legacy-ui-inventory.json";
const cache = new Map();
function walk(node, visit, parents = []) {
  if (!node || typeof node !== "object") return;
  if (node.type) visit(node, parents);
  for (const [key, value] of Object.entries(node)) {
    if (["loc", "start", "end", "extra", "comments", "tokens"].includes(key))
      continue;
    if (Array.isArray(value))
      for (const child of value) walk(child, visit, [...parents, node]);
    else if (value && typeof value === "object")
      walk(value, visit, [...parents, node]);
  }
}
function resolve(from, source) {
  if (!source.startsWith(".") && !source.startsWith("@/")) return null;
  const base = source.startsWith("@/")
    ? path.join(root, "src", source.slice(2))
    : path.resolve(path.dirname(from), source);
  return [base, `${base}.js`, `${base}.jsx`, path.join(base, "index.js")].find(
    (p) => existsSync(p) && !readdirSafe(p),
  );
}
function readdirSafe(p) {
  try {
    readdirSync(p);
    return true;
  } catch {
    return false;
  }
}
function load(file) {
  if (cache.has(file)) return cache.get(file);
  const text = readFileSync(file, "utf8");
  const ast = parse(text, { sourceType: "module", plugins: ["jsx"] });
  const unit = {
    file,
    text,
    ast,
    bindings: new Map(),
    imports: new Map(),
    busy: new Set(),
  };
  cache.set(file, unit);
  walk(ast, (node) => {
    if (node.type === "VariableDeclarator" && node.id.type === "Identifier")
      unit.bindings.set(node.id.name, node.init);
    if (node.type === "ImportDeclaration")
      for (const spec of node.specifiers)
        unit.imports.set(spec.local.name, {
          source: resolve(file, node.source.value),
          name: spec.imported?.name ?? "default",
        });
  });
  return unit;
}
function value(node, unit) {
  if (!node) return undefined;
  if (["StringLiteral", "NumericLiteral", "BooleanLiteral"].includes(node.type))
    return node.value;
  if (node.type === "NullLiteral") return null;
  if (node.type === "Identifier") {
    if (unit.busy.has(node.name)) return undefined;
    unit.busy.add(node.name);
    let result;
    if (unit.bindings.has(node.name))
      result = value(unit.bindings.get(node.name), unit);
    else {
      const imported = unit.imports.get(node.name);
      if (imported?.source)
        result = value(
          { type: "Identifier", name: imported.name },
          load(imported.source),
        );
    }
    unit.busy.delete(node.name);
    return result;
  }
  if (node.type === "ArrayExpression")
    return node.elements
      .flatMap((e) =>
        e?.type === "SpreadElement"
          ? (value(e.argument, unit) ?? [])
          : [value(e, unit)],
      )
      .filter((v) => v !== undefined);
  if (node.type === "ObjectExpression") {
    const result = {};
    for (const p of node.properties) {
      if (p.type === "SpreadElement")
        Object.assign(result, value(p.argument, unit));
      else if (p.type === "ObjectProperty")
        result[p.key.name ?? p.key.value] = value(p.value, unit);
    }
    return result;
  }
  if (node.type === "MemberExpression")
    return value(node.object, unit)?.[
      node.computed ? value(node.property, unit) : node.property.name
    ];
  if (node.type === "JSXExpressionContainer")
    return value(node.expression, unit);
  if (node.type === "BinaryExpression" && node.operator === "+")
    return `${value(node.left, unit) ?? ""}${value(node.right, unit) ?? ""}`;
  return undefined;
}
function attrs(element, unit) {
  return Object.fromEntries(
    element.openingElement.attributes
      .filter((a) => a.type === "JSXAttribute")
      .map((a) => [a.name.name, a.value ? value(a.value, unit) : true]),
  );
}
function label(node, unit) {
  if (!node) return "";
  if (node.type === "JSXText") return node.value.replace(/\s+/g, " ").trim();
  if (node.type === "JSXExpressionContainer")
    return typeof value(node, unit) === "string" ? value(node, unit) : "";
  if (node.type === "JSXElement")
    return node.children
      .map((child) => label(child, unit))
      .filter(Boolean)
      .join(" ")
      .trim();
  return "";
}
function memberKey(node) {
  if (!node) return null;
  if (node.type === "UnaryExpression") return memberKey(node.argument);
  if (["LogicalExpression", "ConditionalExpression"].includes(node.type))
    return memberKey(node.left ?? node.consequent);
  if (node.type === "MemberExpression") {
    const segments = [];
    let current = node;
    while (current.type === "MemberExpression") {
      segments.unshift(current.property.name ?? current.property.value);
      current = current.object;
    }
    if (["form", "values"].includes(current.name)) return segments.join(".");
  }
  return null;
}
function sanitizeFields(fields) {
  return (fields ?? [])
    .filter((f) => f && typeof f === "object" && f.label)
    .map((f) => ({
      key: f.key ?? f.name ?? f.label,
      label: f.label,
      type: f.type ?? "text",
      required: !!f.required,
      table: f.table !== false,
      // Related-record choices are legacy data, not presentation vocabulary.
      options:
        (/customer|vendor|branch|cabang|marketing|pemasaran|courier|kurir|driver|perusahaan|kantor|kabupaten|regency|rekening|account/i.test(
          `${f.key} ${f.label}`,
        )
          ? []
          : (f.options ?? [])
        )
          .map((o) => (typeof o === "object" ? (o.label ?? o.value) : o))
          .filter((o) => typeof o === "string"),
      ...(f.group ? { group: f.group } : {}),
    }));
}
function inspect(file) {
  const unit = load(file);
  let reportProps;
  const headings = [],
    headers = [],
    fields = [],
    buttons = [],
    tabs = [],
    headerSets = {};
  function conditionalGroup(parents) {
    for (const parent of [...parents].reverse()) {
      const test =
        parent.type === "ConditionalExpression"
          ? parent.test
          : parent.type === "LogicalExpression"
            ? parent.left
            : null;
      if (
        test?.type === "BinaryExpression" &&
        /activeTab/.test(unit.text.slice(test.start, test.end))
      ) {
        const tabValue = value(test.right, unit);
        const tabOptions =
          value({ type: "Identifier", name: "TABS" }, unit) ?? [];
        return typeof tabValue === "number"
          ? tabOptions[tabValue]
          : (tabOptions.find((t) => (t.key ?? t.id) === tabValue)?.label ??
              tabValue);
      }
    }
    return undefined;
  }
  walk(unit.ast, (node, parents) => {
    if (node.type !== "JSXElement") return;
    const tag = node.openingElement.name.name;
    const a = attrs(node, unit);
    const text = label(node, unit);
    if (["h1", "h2", "h3"].includes(tag) && text) headings.push(text);
    if (tag === "th" && text) {
      headers.push(text);
      const group = conditionalGroup(parents);
      if (group) {
        headerSets[group] ??= [];
        headerSets[group].push(text);
      }
    }
    if (tag === "button" && text && text.length < 110) buttons.push(text);
    if (tag === "ReportPage") {
      if (a.title) headings.unshift(a.title);
      if (a.columns) headers.push(...a.columns.map((c) => c.label));
      reportProps = {
        dateField: a.dateField,
        branchField: a.branchField,
        searchable: a.searchable,
        selectFilters: sanitizeFields(a.selectFilters ?? []),
        summaries: (a.summaries ?? []).map((item) => item.label),
      };
    }
    if (
      ![
        "input",
        "select",
        "textarea",
        "TextInput",
        "SelectInput",
        "SelectField",
        "FormField",
        "InputField",
        "ToolbarInput",
        "ToolbarSelect",
        "Field",
        "Toggle",
        "FilterDate",
        "FilterSelect",
      ].includes(tag)
    )
      return;
    if (tag === "Field" && node.children.some((c) => c.type === "JSXElement"))
      return;
    const jsxParents = parents.filter((p) => p.type === "JSXElement").reverse();
    let fieldLabel = a.label;
    let parentField;
    if (!fieldLabel)
      for (const parent of jsxParents.slice(0, 3)) {
        const pa = attrs(parent, unit);
        if (pa.label) {
          fieldLabel = pa.label;
          parentField = pa;
          break;
        }
        if (parent.openingElement.name.name === "label") {
          const span = parent.children.find(
            (c) =>
              c.type === "JSXElement" && c.openingElement.name.name === "span",
          );
          if (span) {
            fieldLabel = label(span, unit);
            parentField = pa;
            break;
          }
        }
        const sibling = parent.children.find(
          (c) =>
            c.type === "JSXElement" &&
            ["label", "FieldLabel", "Label"].includes(
              c.openingElement.name.name,
            ),
        );
        if (sibling) {
          fieldLabel = label(sibling, unit);
          parentField = attrs(sibling, unit);
          break;
        }
      }
    if (!fieldLabel || /[{}]/.test(fieldLabel)) return;
    const valNode = node.openingElement.attributes.find((at) =>
      ["value", "checked"].includes(at.name?.name),
    )?.value?.expression;
    const key = memberKey(valNode) ?? a.id ?? fieldLabel;
    const group = conditionalGroup(parents);
    const mappedOptions = node.children.flatMap((c) =>
      c.type === "JSXExpressionContainer" &&
      c.expression.type === "CallExpression" &&
      c.expression.callee.property?.name === "map"
        ? (value(c.expression.callee.object, unit) ?? [])
        : [],
    );
    const options = a.options ?? [
      ...node.children
        .filter(
          (c) =>
            c.type === "JSXElement" && c.openingElement.name.name === "option",
        )
        .map((c) => label(c, unit))
        .filter(Boolean),
      ...mappedOptions,
    ];
    fields.push({
      key,
      label: fieldLabel.replace(/\s*\*$/, ""),
      type:
        tag === "Toggle"
          ? "checkbox"
          : tag === "FilterDate"
            ? "date"
            : tag.toLowerCase().includes("select")
              ? "select"
              : tag === "textarea"
                ? "textarea"
                : (a.type ?? "text"),
      required: !!(a.required || parentField?.required),
      options,
      ...(group ? { group } : {}),
    });
  });
  for (const name of ["TABS", "tabs"]) {
    const t = value({ type: "Identifier", name }, unit);
    if (Array.isArray(t))
      tabs.push(
        ...t.map((v) => (typeof v === "string" ? v : v.label)).filter(Boolean),
      );
  }
  const declarations = {};
  for (const name of unit.bindings.keys()) {
    if (
      /^(config|.*CONFIG|.*COLUMNS|columns|.*FIELDS|.*Fields|MENU|MENU_LIST|TABS)$/i.test(
        name,
      )
    ) {
      const v = value({ type: "Identifier", name }, unit);
      if (v) declarations[name] = v;
    }
  }
  const config = declarations.config;
  function configTabs(items) {
    return (items ?? []).map((t) => ({
      label: t.label,
      fields: sanitizeFields(t.fields),
      actions: (t.actions ?? []).map((action) => action.label).filter(Boolean),
      tabs: configTabs(t.tabs),
    }));
  }
  const columns = Object.entries(declarations)
    .filter(([k, v]) => /columns/i.test(k) && Array.isArray(v))
    .flatMap(([, v]) =>
      v
        .filter((x) => x?.label)
        .map((x) => ({ key: x.key, label: x.label, type: x.type ?? "text" })),
    );
  return {
    source: path.relative(root, file).replaceAll("\\", "/"),
    sha256: createHash("sha256").update(unit.text).digest("hex"),
    headings: [...new Set(headings)],
    columns: columns.length
      ? columns
      : [...new Set(headers)].map((h) => ({ key: h, label: h })),
    columnSets: Object.fromEntries(
      Object.entries(declarations)
        .filter(([k, v]) => /columns/i.test(k) && Array.isArray(v))
        .map(([k, v]) => [
          k,
          v
            .filter((c) => c?.label)
            .map((c) => ({
              key: c.key,
              label: c.label,
              type: c.type ?? "text",
            })),
        ]),
    ),
    headerSets,
    fields: sanitizeFields([
      ...new Map(fields.map((f) => [`${f.group ?? ""}:${f.key}`, f])).values(),
    ]),
    tabs: [...new Set(tabs)],
    actions: [...new Set(buttons)],
    ...(config
      ? { config: { title: config.title, tabs: configTabs(config.tabs) } }
      : {}),
    ...(reportProps ? { reportProps } : {}),
    configs: Object.fromEntries(
      Object.entries(declarations)
        .filter(([k, v]) => /CONFIG/.test(k) && (v?.fields || v?.recapColumns))
        .map(([k, v]) => [
          k,
          {
            label: v.label,
            fields: sanitizeFields(v.fields),
            entityLabel: v.entityLabel,
            recapTitle: v.recapTitle,
            recapColumns: v.recapColumns?.map((column) => ({
              key: column.key,
              label: column.label,
              type: column.type ?? "text",
            })),
            columns: v.columns?.map((c) => ({ key: c.key, label: c.label })),
            actions: v.rowActions?.map((a) => a.label),
            tools: v.tools?.map((a) => a.label),
          },
        ]),
    ),
  };
}
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(path.join(dir, e.name)) : [path.join(dir, e.name)],
  );
}
const sourceFiles = files(path.join(root, "src")).filter((f) =>
  /\.jsx?$/.test(f),
);
const components = sourceFiles.map(inspect);
const app = load(path.join(root, "src/App.jsx"));
const routes = [];
walk(app.ast, (node) => {
  if (node.type !== "JSXElement" || node.openingElement.name.name !== "Route")
    return;
  const routePath = attrs(node, app).path;
  const component = node.openingElement.attributes.find(
    (a) => a.name?.name === "element",
  )?.value?.expression?.openingElement?.name?.name;
  if (routePath && component)
    routes.push({
      path: routePath,
      component,
      source: path
        .relative(root, app.imports.get(component).source)
        .replaceAll("\\", "/"),
    });
});
const header = load(path.join(root, "src/components/header.jsx"));
function menu(items) {
  return (items ?? []).map((i) => ({
    label: i.name,
    ...(i.link ? { href: i.link } : {}),
    ...(i.children ? { children: menu(i.children) } : {}),
  }));
}
const inventory = {
  legacyRoot: root,
  method:
    "Read-only AST inspection; no legacy JS executed, no fixture values copied",
  routes,
  navigation: menu(value({ type: "Identifier", name: "MENU" }, header)),
  assets: files(path.join(root, "public")).map((f) => ({
    path: path.relative(root, f).replaceAll("\\", "/"),
    bytes: readFileSync(f).length,
    usageRights: "Unverified; not copied",
  })),
  components,
};
writeFileSync(destination, `${JSON.stringify(inventory, null, 2)}\n`);
console.log(
  `Inventoried ${routes.length} routes, ${components.length} JS/JSX modules, ${inventory.assets.length} assets.`,
);
console.log(routes.map((r) => `${r.path} | ${r.source}`).join("\n"));
