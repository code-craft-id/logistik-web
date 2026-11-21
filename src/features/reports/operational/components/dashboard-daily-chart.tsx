/**
 * Daily AWB count column chart (single series, so no legend: the title names it).
 * Legacy "Grafik Penjualan" plots nominal per billing category; that money rule is
 * not approved (D-11/D-15), so this plots the approved count source instead.
 */
export function DashboardDailyChart({
  days,
}: {
  days: { date: string; count: number }[];
}) {
  const max = Math.max(0, ...days.map((day) => day.count));
  // Round the axis top to a readable step so gridlines land on whole numbers.
  const step = max <= 4 ? 1 : 10 ** Math.floor(Math.log10(max / 4));
  const top = max ? Math.ceil(max / 4 / step) * step * 4 : 4;
  const ticks = [top, (top * 3) / 4, top / 2, top / 4];
  const peak = days.reduce(
    (best, day) => (day.count > best.count ? day : best),
    days[0] ?? { date: "", count: 0 },
  );
  const labelEvery = Math.ceil(days.length / 8);
  return (
    <figure className="min-w-0 space-y-3">
      <figcaption className="space-y-1">
        <span className="block font-semibold">Grafik Transaksi Harian</span>
        <span className="block text-sm text-muted-foreground">
          Jumlah AWB per tanggal transaksi (Asia/Jakarta). Nominal per kategori
          bayar belum tersedia.
        </span>
      </figcaption>
      <div className="flex gap-2">
        <div
          aria-hidden="true"
          className="flex h-48 w-8 shrink-0 flex-col justify-between text-right text-xs tabular-nums text-muted-foreground"
        >
          {ticks.map((tick) => (
            <span key={tick} className="-translate-y-2">
              {tick}
            </span>
          ))}
          <span className="translate-y-2">0</span>
        </div>
        <div className="min-w-0 flex-1 overflow-x-auto">
          <div
            className="relative h-48 border-b border-border"
            style={{ minWidth: `${days.length * 14}px` }}
          >
            {ticks.map((tick) => (
              <div
                key={tick}
                aria-hidden="true"
                className="absolute inset-x-0 border-t border-border/60"
                style={{ bottom: `${(tick / top) * 100}%` }}
              />
            ))}
            <ol
              aria-label="Jumlah AWB per hari"
              className="absolute inset-0 flex items-end gap-0.5"
            >
              {days.map((day) => (
                <li
                  key={day.date}
                  // biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard access to the per-day tooltip
                  tabIndex={0}
                  className="group relative flex h-full min-w-0 flex-1 items-end justify-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span
                    className="block w-full max-w-6 rounded-t bg-chart-1 group-hover:opacity-80"
                    style={{
                      height: `${(day.count / top) * 100}%`,
                      minHeight: day.count ? "2px" : 0,
                    }}
                  />
                  <span className="sr-only">
                    {day.date}: {day.count} AWB
                  </span>
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-0 z-10 hidden whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-sm group-hover:block group-focus-visible:block"
                  >
                    {day.date} · {day.count} AWB
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div
            aria-hidden="true"
            className="flex gap-0.5 pt-1 text-xs tabular-nums text-muted-foreground"
            style={{ minWidth: `${days.length * 14}px` }}
          >
            {days.map((day, index) => (
              <span key={day.date} className="min-w-0 flex-1 text-center">
                {index % labelEvery === 0 || index === days.length - 1
                  ? Number(day.date.slice(8))
                  : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
      {peak.count > 0 && (
        <p className="text-sm text-muted-foreground">
          Tertinggi {peak.count} AWB pada {peak.date}.
        </p>
      )}
      <details className="text-sm">
        <summary className="inline-flex min-h-11 cursor-pointer items-center text-primary underline underline-offset-4">
          Lihat sebagai tabel
        </summary>
        <div className="max-h-64 overflow-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="py-1 font-medium">Tanggal (Asia/Jakarta)</th>
                <th className="py-1 text-right font-medium">AWB</th>
              </tr>
            </thead>
            <tbody>
              {days.map((day) => (
                <tr key={day.date} className="border-t">
                  <td className="py-1">{day.date}</td>
                  <td className="py-1 text-right tabular-nums">{day.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
