import type { Metadata } from "next";
import { FoundationExamples } from "@/components/examples/foundation-examples";
import { VendorFormExample } from "@/components/examples/vendor-form-example";
import { PageHeading } from "@/components/patterns/page-heading";

export const metadata: Metadata = { title: "UI examples" };

export default function ExamplesPage() {
  return (
    <>
      <PageHeading
        title="UI examples"
        description="A workbench for shared interface patterns. All rows are synthetic examples; interactions affect this page only."
      />
      <FoundationExamples />
      <VendorFormExample />
    </>
  );
}
