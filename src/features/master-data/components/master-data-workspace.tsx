"use client";
import { useState } from "react";
import {
  type ReferenceApi,
  type ReferenceCapabilities,
  ReferenceWorkspace,
} from "@/components/patterns/reference-workspace";
import { Button } from "@/components/ui/button";
import {
  listMasterData,
  masterDataChoices,
  masterDataDetail,
  removeMasterData,
  saveMasterData,
} from "../actions";
import { type MasterKind, masterForms } from "../contracts";
import { personnelImportKind } from "../personnel-import-contracts";
import { PersonnelImportTools } from "./personnel-import-tools";

const api: ReferenceApi = {
  list: listMasterData,
  detail: masterDataDetail,
  save: saveMasterData,
  remove: removeMasterData,
  choices: masterDataChoices,
};
export function MasterDataWorkspace({
  kinds,
  title,
  capabilities,
}: {
  kinds: MasterKind[];
  title: string;
  capabilities: Record<string, ReferenceCapabilities>;
}) {
  const [kind, setKind] = useState(kinds[0]);
  const [revision, setRevision] = useState(0);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <nav aria-label={title} className="flex flex-wrap gap-2">
        {kinds.map((value) => (
          <Button
            className="min-h-11"
            key={value}
            variant={value === kind ? "default" : "outline"}
            aria-pressed={value === kind}
            onClick={() => setKind(value)}
          >
            {masterForms[value].label}
          </Button>
        ))}
      </nav>
      {personnelImportKind.safeParse(kind).success &&
        capabilities[kind]?.create && (
          <PersonnelImportTools
            key={kind}
            kind={personnelImportKind.parse(kind)}
            onImported={() => setRevision((value) => value + 1)}
          />
        )}
      <ReferenceWorkspace
        key={`${kind}-${revision}`}
        kind={kind}
        definition={masterForms[kind]}
        capabilities={capabilities[kind] ?? {}}
        api={api}
      />
    </div>
  );
}
