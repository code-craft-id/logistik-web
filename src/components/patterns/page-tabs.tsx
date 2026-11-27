import Link from "next/link";

/**
 * Link tabs for one page that shows several filtered views of the same
 * records (for example Outbound/Inbound). Each tab is a real URL, so menu
 * items can open a tab directly.
 */
export function PageTabs({
  label,
  tabs,
  active,
}: {
  label: string;
  tabs: { key: string; label: string; href: string }[];
  active: string;
}) {
  return (
    <nav aria-label={label} className="flex gap-4 overflow-x-auto border-b">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={tab.key === active ? "page" : undefined}
          className="inline-flex min-h-11 shrink-0 items-center border-b-2 border-transparent px-1 text-sm whitespace-nowrap aria-[current=page]:border-primary aria-[current=page]:font-semibold"
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
