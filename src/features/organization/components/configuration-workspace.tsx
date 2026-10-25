"use client";
import { useEffect, useMemo, useState } from "react";
import {
  type ReferenceApi,
  type ReferenceCapabilities,
  ReferenceWorkspace,
} from "@/components/patterns/reference-workspace";
import { SearchSelect } from "@/components/patterns/search-select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  configurationCapabilities,
  configurationChoices,
  configurationDetail,
  listConfigurations,
  removeConfiguration,
  saveConfiguration,
} from "../settings-actions";
import {
  type ConfigurationKind,
  configurationForms,
} from "../settings-contracts";

import { CompanySettingEditor } from "./company-setting-editor";
import { WhatsAppMessagePreview } from "./whatsapp-message-preview";

const api: ReferenceApi = {
  list: listConfigurations,
  detail: configurationDetail,
  save: saveConfiguration,
  remove: removeConfiguration,
  choices: configurationChoices,
};
export function ConfigurationWorkspace({
  kind,
  autoSelectCompany = false,
}: {
  kind: ConfigurationKind;
  autoSelectCompany?: boolean;
}) {
  const [attempt, setAttempt] = useState(0);
  return (
    <ConfigurationLoader
      key={`${kind}:${attempt}`}
      kind={kind}
      autoSelectCompany={autoSelectCompany}
      onRetry={() => setAttempt((value) => value + 1)}
    />
  );
}
function ConfigurationLoader({
  kind,
  autoSelectCompany,
  onRetry,
}: {
  kind: ConfigurationKind;
  autoSelectCompany: boolean;
  onRetry: () => void;
}) {
  const [capabilities, setCapabilities] =
    useState<ReferenceCapabilities | null>(null);
  const [error, setError] = useState("");
  const [companyId, setCompanyId] = useState("");
  const fixedValues = useMemo(
    () => (companyId ? { companyId: Number(companyId) } : undefined),
    [companyId],
  );
  useEffect(() => {
    let cancelled = false;
    setCapabilities(null);
    setError("");
    void configurationCapabilities(kind)
      .then((result) => {
        if (cancelled) return;
        if (result.ok) setCapabilities(result.data);
        else setError(result.message);
      })
      .catch(() => {
        if (!cancelled) setError("Konfigurasi gagal dimuat.");
      });
    return () => {
      cancelled = true;
    };
  }, [kind]);
  if (error)
    return (
      <div className="space-y-3">
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
        <Button className="min-h-11" variant="outline" onClick={onRetry}>
          Coba lagi
        </Button>
      </div>
    );
  if (!capabilities) return <output>Memuat konfigurasi…</output>;
  return (
    <div className="space-y-4">
      {kind !== "vendor_tax" && (
        <CompanySelector
          kind={kind}
          value={companyId}
          onChange={setCompanyId}
          autoSelect={autoSelectCompany}
        />
      )}
      {kind !== "vendor_tax" &&
        kind !== "whatsapp_configuration" &&
        companyId && (
          <CompanySettingEditor
            key={`${kind}:${companyId}`}
            kind={kind}
            companyId={Number(companyId)}
            capabilities={capabilities}
          />
        )}
      {(kind === "vendor_tax" ||
        (kind === "whatsapp_configuration" && companyId)) && (
        <div
          className={
            kind === "whatsapp_configuration" ? "grid gap-6 xl:grid-cols-2" : ""
          }
        >
          <ReferenceWorkspace
            key={`${kind}:${companyId}`}
            fixedValues={fixedValues}
            kind={kind}
            definition={configurationForms[kind]}
            capabilities={capabilities}
            api={api}
          />
          {kind === "whatsapp_configuration" && <WhatsAppMessagePreview />}
        </div>
      )}
    </div>
  );
}

function CompanySelector({
  kind,
  value,
  onChange,
  autoSelect,
}: {
  kind: ConfigurationKind;
  value: string;
  onChange: (value: string) => void;
  autoSelect: boolean;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [items, setItems] = useState<{ id: number; name: string }[]>([]);
  const [selectedLabel, setSelectedLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: An explicit retry reloads the same company query.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    void configurationChoices(kind, "company", { page, pageSize: 50, search })
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          setError(result.message);
          return;
        }
        if (
          autoSelect &&
          !value &&
          !search &&
          result.data.items.length === 1 &&
          result.data.totalPages === 1
        )
          onChange(String(result.data.items[0].id));
        setItems(result.data.items);
        setPages(result.data.totalPages);
      })
      .catch(() => {
        if (!cancelled) setError("Pilihan perusahaan gagal dimuat.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kind, page, search, attempt, autoSelect, value, onChange]);
  if (
    autoSelect &&
    value &&
    !search &&
    !loading &&
    !error &&
    items.length === 1 &&
    pages === 1
  )
    return (
      <p className="text-sm text-muted-foreground">
        Perusahaan: {items[0].name}
      </p>
    );
  return (
    <section
      aria-label="Pilih perusahaan"
      className="space-y-3 rounded-md border bg-background p-4"
    >
      <div className="space-y-2">
        <Label htmlFor={`company-filter-${kind}`}>Perusahaan</Label>
        <SearchSelect
          id={`company-filter-${kind}`}
          label="Perusahaan"
          value={value}
          selectedLabel={selectedLabel}
          options={items}
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          onValueChange={(value, label) => {
            setSelectedLabel(label);
            onChange(value);
          }}
          loading={loading}
          error={error}
          page={page}
          pages={pages}
          onPageChange={setPage}
        />
      </div>
      {loading && <output>Memuat perusahaan…</output>}
      {error && (
        <div className="space-y-2">
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
          <Button
            variant="outline"
            className="min-h-11"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Coba lagi
          </Button>
        </div>
      )}
    </section>
  );
}
