import { LoadingState } from "@/components/patterns/content-state";

// Instant feedback on menu navigation for every workspace page without its own loading.tsx.
export default function Loading() {
  return <LoadingState label="Memuat…" />;
}
