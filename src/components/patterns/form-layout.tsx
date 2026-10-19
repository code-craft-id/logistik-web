"use client";

import { Tabs } from "radix-ui";
import type { ReactNode } from "react";

export type FormLayoutTab = { id: string; label: string; content: ReactNode };

/** Shared create/update composition; callers own fields, actions, and any persistence. */
export function FormLayout({
  label,
  tabs,
  actions,
}: {
  label: string;
  tabs: readonly FormLayoutTab[];
  actions: ReactNode;
}) {
  return (
    <Tabs.Root defaultValue={tabs[0]?.id} className="min-w-0 space-y-6">
      <Tabs.List
        aria-label={label}
        className="flex flex-wrap gap-1 border-b pb-2"
      >
        {tabs.map((tab) => (
          <Tabs.Trigger
            key={tab.id}
            value={tab.id}
            className="min-h-11 rounded-md px-3 text-sm font-medium hover:bg-accent data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
          >
            {tab.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {tabs.map((tab) => (
        <Tabs.Content
          key={tab.id}
          value={tab.id}
          forceMount
          className="space-y-5 data-[state=inactive]:hidden"
        >
          {tab.content}
        </Tabs.Content>
      ))}
      <div className="flex flex-wrap gap-3 border-t pt-5">{actions}</div>
    </Tabs.Root>
  );
}
