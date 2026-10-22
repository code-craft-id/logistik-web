import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { PreviewScreen } from "./preview-contract";
import { PreviewWorkspace } from "./preview-workspace";

export function PreviewScreenPage({ screen }: { screen: PreviewScreen }) {
  return (
    <>
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {screen.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Legacy UI presentation preview
        </p>
      </div>
      <p className="rounded-lg border bg-background px-4 py-3 text-sm leading-6 text-muted-foreground">
        Preview only · All rows and selections are synthetic. Nothing is loaded
        from or saved to operational services. {screen.integration}
      </p>
      {screen.kind === "workspace" && <PreviewWorkspace screen={screen} />}
      {screen.kind === "heading" && (
        <section className="rounded-xl border bg-background p-5">
          <h2 className="text-base font-semibold">{screen.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The legacy screen contains this heading only. No additional workflow
            is defined.
          </p>
        </section>
      )}
      {screen.links?.length ? (
        <ul className="divide-y rounded-xl border bg-background px-4">
          {screen.links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="flex min-h-14 items-center justify-between gap-3 py-3 text-sm hover:text-primary"
              >
                {link.label}
                <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
