"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveHelpAiAction } from "../settings-actions";

export function HelpAiForm({
  url,
  model,
  hasKey,
}: {
  url: string;
  model: string;
  hasKey: boolean;
}) {
  const [state, action, pending] = useActionState(saveHelpAiAction, {
    ok: true,
    message: "",
  });
  return (
    <form action={action} className="max-w-xl space-y-4">
      <div className="space-y-2">
        <Label htmlFor="url">URL API (base URL)</Label>
        <Input
          id="url"
          name="url"
          type="url"
          required
          defaultValue={url}
          placeholder="https://api.openai.com/v1"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="model">Model</Label>
        <Input id="model" name="model" defaultValue={model} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="key">API key</Label>
        <Input
          id="key"
          name="key"
          type="password"
          autoComplete="off"
          placeholder={hasKey ? "Tersimpan. Kosongkan bila tidak diganti." : ""}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan dan menguji..." : "Simpan"}
      </Button>
      {state.message && (
        <output
          className={
            state.ok ? "block text-sm" : "block text-sm text-destructive"
          }
        >
          {state.message}
        </output>
      )}
    </form>
  );
}
