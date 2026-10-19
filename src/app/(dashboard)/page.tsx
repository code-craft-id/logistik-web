import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { PageHeading } from "@/components/patterns/page-heading";
import { Button } from "@/components/ui/button";

export default function FoundationPage() {
  return (
    <>
      <PageHeading
        title="A shared foundation for LMS"
        description="Consistent navigation, readable data, and clear feedback for the logistics workspace."
        action={
          <Button asChild className="min-h-11">
            <Link href="/ui-examples">
              Explore UI examples
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />
      <section
        aria-labelledby="preview-heading"
        className="border-y bg-muted/40 px-5 py-5"
      >
        <h2 id="preview-heading" className="font-semibold">
          Foundation preview
        </h2>
        <p className="mt-2 max-w-prose text-sm leading-6 text-muted-foreground">
          Only the foundation and example pages are available. Domain names show
          the planned workspace; they do not indicate access rights or working
          features. No operational records are loaded or saved.
        </p>
      </section>
      <section aria-labelledby="patterns-heading">
        <h2 id="patterns-heading" className="text-lg font-semibold">
          Inspect the shared patterns
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Small, reusable building blocks for future feature work.
        </p>
        <ul className="mt-5 divide-y border-y">
          {[
            [
              "Tables & filters",
              "Search synthetic rows, change filters, and inspect contained horizontal scrolling.",
              "table-examples",
            ],
            [
              "Forms & validation",
              "Try labeled fields, helper text, validation feedback, and disabled controls.",
              "form-examples",
            ],
            [
              "Dialogs & feedback",
              "Inspect keyboard focus, dismissal, and loading, empty, and error examples.",
              "dialog-examples",
            ],
          ].map(([title, description, anchor]) => (
            <li key={anchor}>
              <Link
                href={`/ui-examples#${anchor}`}
                className="flex items-center justify-between gap-6 py-5 hover:text-primary"
              >
                <div>
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {description}
                  </p>
                </div>
                <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="next-heading" className="max-w-prose">
        <h2 id="next-heading" className="text-lg font-semibold">
          Built for the next feature
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Use the examples to compare patterns before building a screen.
          Authentication, branch access, and business workflows belong to their
          own roadmap tickets.
        </p>
      </section>
    </>
  );
}
