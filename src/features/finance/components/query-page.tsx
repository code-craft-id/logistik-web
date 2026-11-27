import { type ReactNode, Suspense } from "react";
import { LoadingState } from "@/components/patterns/content-state";

type Query = Record<string, string | string[] | undefined>;
type Props = {
  searchParams: Promise<Query>;
  Screen: (props: { query: Query }) => Promise<ReactNode>;
};
export function FinanceQueryPage(props: Props) {
  return (
    <Suspense fallback={<LoadingState label="Memuat keuangan…" />}>
      <Content {...props} />
    </Suspense>
  );
}
async function Content({ searchParams, Screen }: Props) {
  return <Screen query={await searchParams} />;
}
