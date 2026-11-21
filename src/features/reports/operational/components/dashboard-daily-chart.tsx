/** Daily counts for short periods, grouped monthly for annual dashboard views. */
export function DashboardDailyChart({
  days,
}: {
  days: { date: string; count: number }[];
}) {
  const monthly = days.length > 31;
  const chartDays = monthly
    ? Array.from(
        days.reduce((months, day) => {
          const month = day.date.slice(0, 7);
          months.set(month, (months.get(month) ?? 0) + day.count);
          return months;
        }, new Map<string, number>()),
        ([date, count]) => ({ date, count }),
      )
    : days;
  const max = Math.max(0, ...chartDays.map((day) => day.count));
  // Round the axis top to a readable step so gridlines land on whole numbers.
  const step = max <= 4 ? 1 : 10 ** Math.floor(Math.log10(max / 4));
  const top = max ? Math.ceil(max / 4 / step) * step * 4 : 4;
  const ticks = [top, (top * 3) / 4, top / 2, top / 4];
  const peak = chartDays.reduce(
    (best, day) => (day.count > best.count ? day : best),
    chartDays[0] ?? { date: "", count: 0 },
  );
  const labelEvery = Math.max(1, Math.ceil(chartDays.length / 8));
  const minWidth = `${chartDays.length * (monthly ? 42 : 14)}px`;
  return (
    <figure className="min-w-0 space-y-3">
      <figcaption className="space-y-1">
        <span className="block font-semibold">
          {monthly ? "Grafik Transaksi Bulanan" : "Grafik Transaksi Harian"}
        </span>
        <span className="block text-sm text-muted-foreground">
          {monthly
            ? "Jumlah AWB per bulan transaksi (Asia/Jakarta)."
            : "Jumlah AWB per tanggal transaksi (Asia/Jakarta)."}{" "}
          Nominal per kategori bayar belum tersedia.
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
            style={{ minWidth }}
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
              aria-label={
                monthly ? "Jumlah AWB per bulan" : "Jumlah AWB per hari"
              }
              className="absolute inset-0 flex items-end gap-0.5"
            >
              {chartDays.map((day) => (
                <li
                  key={day.date}
                  // biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard access to the per-period tooltip
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
            style={{ minWidth }}
          >
            {chartDays.map((day, index) => (
              <span key={day.date} className="min-w-0 flex-1 text-center">
                {index % labelEvery === 0 || index === chartDays.length - 1
                  ? monthly
                    ? `${day.date.slice(5, 7)}/${day.date.slice(2, 4)}`
                    : Number(day.date.slice(8))
                  : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
      {peak.count > 0 && (
        <p className="text-sm text-muted-foreground">
          {monthly ? "Tertinggi per bulan" : "Tertinggi"} {peak.count} AWB pada{" "}
          {peak.date}.
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
                <th className="py-1 font-medium">
                  {monthly ? "Bulan (Asia/Jakarta)" : "Tanggal (Asia/Jakarta)"}
                </th>
                <th className="py-1 text-right font-medium">AWB</th>
              </tr>
            </thead>
            <tbody>
              {chartDays.map((day) => (
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
