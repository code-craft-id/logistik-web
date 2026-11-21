import { code128Modules } from "@/lib/barcode/code128";

/**
 * Printable Code 128 barcode with the human-readable value beneath.
 * Bars use the foreground token on the surface; a 10-module quiet zone keeps
 * it scannable. Server-rendered, no client JavaScript.
 */
export function Barcode({
  value,
  height = 64,
  className,
}: {
  value: string;
  height?: number;
  className?: string;
}) {
  let modules: number[];
  try {
    modules = code128Modules(value);
  } catch {
    return (
      <p className="text-sm text-muted-foreground">
        Barcode tidak tersedia untuk nomor ini.
      </p>
    );
  }
  const quiet = 10;
  const width = modules.reduce((sum, w) => sum + w, 0) + quiet * 2;
  const bars: { x: number; w: number }[] = [];
  let x = quiet;
  modules.forEach((w, index) => {
    if (index % 2 === 0) bars.push({ x, w });
    x += w;
  });
  return (
    <figure className={className}>
      <svg
        role="img"
        aria-label={`Barcode ${value}`}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-16 w-full max-w-sm bg-white text-black"
      >
        {bars.map((bar) => (
          <rect
            key={bar.x}
            x={bar.x}
            y={0}
            width={bar.w}
            height={height}
            fill="currentColor"
          />
        ))}
      </svg>
      <figcaption className="mt-1 font-mono text-sm tracking-widest">
        {value}
      </figcaption>
    </figure>
  );
}
