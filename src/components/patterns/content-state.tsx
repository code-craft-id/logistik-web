import { CircleAlert, SearchX } from "lucide-react";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div
      aria-live="polite"
      className="flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center"
    >
      <SearchX className="size-6 text-muted-foreground" aria-hidden="true" />
      <h3 className="font-semibold">{title}</h3>
      <p className="max-w-prose text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div
      role="alert"
      className="flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center"
    >
      <CircleAlert className="size-6 text-destructive" aria-hidden="true" />
      <h3 className="font-semibold">{title}</h3>
      <p className="max-w-prose text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}

export function LoadingState({
  label = "Loading content",
}: {
  label?: string;
}) {
  return (
    <div aria-live="polite" className="space-y-5 p-6">
      <span className="sr-only">{label}</span>
      {["first", "second", "third", "fourth"].map((key) => (
        <div key={key} aria-hidden="true" className="flex gap-6">
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-5 flex-1" />
        </div>
      ))}
    </div>
  );
}
