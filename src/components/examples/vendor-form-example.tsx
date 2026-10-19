"use client";

import { useState } from "react";
import { FormField } from "@/components/patterns/form-field";
import { FormLayout } from "@/components/patterns/form-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function VendorFormExample() {
  const [active, setActive] = useState(true);
  const [message, setMessage] = useState("");
  return (
    <section aria-labelledby="vendor-example-heading" className="space-y-5">
      <div>
        <h2 id="vendor-example-heading" className="text-lg font-semibold">
          Vendor-style form example
        </h2>
        <p className="mt-1 max-w-prose text-sm leading-6 text-muted-foreground">
          Static fixtures only. No records are loaded or saved. Tax and
          accounting panels demonstrate layout only; their business rules remain
          unresolved.
        </p>
      </div>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          setMessage("Example submitted locally. Nothing was saved.");
        }}
      >
        <FormLayout
          label="Vendor example sections"
          tabs={[
            {
              id: "vendor",
              label: "Vendor data",
              content: (
                <div className="grid gap-5 sm:grid-cols-2">
                  {[
                    ["name", "Name", "Example vendor"],
                    ["address-1", "Address line 1", "Example address"],
                    ["address-2", "Address line 2", ""],
                    ["city", "City", "Example city"],
                    ["postal", "Postal code", ""],
                    ["phone", "Phone", ""],
                    ["fax", "Fax", ""],
                    ["contact", "Contact name", "Example contact"],
                    ["email", "Email", ""],
                  ].map(([id, label, value]) => (
                    <FormField key={id} id={`vendor-${id}`} label={label}>
                      <Input
                        id={`vendor-${id}`}
                        defaultValue={value}
                        className="min-h-11"
                      />
                    </FormField>
                  ))}
                  <FormField id="vendor-branch" label="Branch">
                    <select
                      id="vendor-branch"
                      className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                      defaultValue="example"
                    >
                      <option value="example">Example branch</option>
                    </select>
                  </FormField>
                  <div className="space-y-2">
                    <span
                      id="vendor-status-label"
                      className="text-sm font-medium"
                    >
                      Status
                    </span>
                    <Button
                      type="button"
                      role="switch"
                      aria-labelledby="vendor-status-label"
                      aria-checked={active}
                      variant={active ? "secondary" : "outline"}
                      className="flex min-h-11"
                      onClick={() => setActive(!active)}
                    >
                      {active ? "ON" : "OFF"}
                    </Button>
                  </div>
                </div>
              ),
            },
            {
              id: "tax",
              label: "Tax (NPWP)",
              content: (
                <>
                  <p className="text-sm text-muted-foreground">
                    Unverified image. Field names follow the provider note; no
                    tax validation is implemented.
                  </p>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {[
                      "Tax number",
                      "Tax name",
                      "Tax address line 1",
                      "Tax address line 2",
                      "Tax city",
                      "Tax postal code",
                    ].map((label, index) => (
                      <FormField
                        key={label}
                        id={`vendor-tax-${index}`}
                        label={label}
                      >
                        <Input
                          id={`vendor-tax-${index}`}
                          className="min-h-11"
                        />
                      </FormField>
                    ))}
                  </div>
                </>
              ),
            },
            {
              id: "accounting",
              label: "Accounting",
              content: (
                <>
                  <p className="text-sm text-muted-foreground">
                    Layout preview only. Account choices and financial behavior
                    are unavailable pending domain decisions.
                  </p>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {[
                      "Debit account",
                      "Credit account (payables)",
                      "Credit account (revenue)",
                      "Revenue share %",
                      "Commission %",
                    ].map((label, index) => (
                      <FormField
                        key={label}
                        id={`vendor-account-${index}`}
                        label={label}
                      >
                        <Input
                          id={`vendor-account-${index}`}
                          disabled
                          placeholder="Unavailable in this example"
                          className="min-h-11"
                        />
                      </FormField>
                    ))}
                  </div>
                </>
              ),
            },
          ]}
          actions={
            <>
              <Button type="submit" className="min-h-11">
                Submit example
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={() =>
                  setMessage(
                    "Back is a preview action. No navigation or records changed.",
                  )
                }
              >
                Back example
              </Button>
            </>
          }
        />
        <output className="mt-4 block min-h-6 text-sm text-muted-foreground">
          {message}
        </output>
      </form>
    </section>
  );
}
