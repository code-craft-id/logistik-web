import { chartIllustrations } from "@/components/examples/dashboard-chart-fixtures";

const series = ["CASH", "KREDIT", "COD", "TUNAI - TRANSFER"];
const colors = ["text-chart-1", "text-chart-2", "text-chart-3", "text-chart-4"];

export function DashboardChart({
  kind,
  label,
}: {
  kind: "monthly" | "sales" | "invoices" | "daily";
  label: string;
}) {
  const labels = kind === "invoices" ? ["Paid", "Unpaid"] : series;
  return (
    <figure className="space-y-3">
      <p className="text-xs leading-5 text-muted-foreground">
        Synthetic illustration · no operational or financial meaning. Values
        unavailable.
      </p>
      {kind === "monthly" ? (
        <section
          className="overflow-x-auto"
          aria-label={`${label} illustration`}
        >
          <svg
            role="img"
            aria-label={`${label}: twelve illustrative stacked bars, no actual values`}
            viewBox="0 0 720 210"
            className="min-w-lg w-full"
          >
            <title>{`${label} — synthetic illustration`}</title>
            {[40, 80, 120, 160].map((y) => (
              <path
                key={y}
                d={`M20 ${y} H710`}
                className="stroke-border"
                fill="none"
              />
            ))}
            {chartIllustrations.bars.map((height, index) => (
              <g key={chartIllustrations.months[index]}>
                {[0.48, 0.32, 0.12, 0.08].map((ratio, segment) => {
                  const preceding = [0, 0.48, 0.8, 0.92][segment];
                  return (
                    <rect
                      key={series[segment]}
                      x={30 + index * 56}
                      y={170 - height * (preceding + ratio)}
                      width="28"
                      height={height * ratio}
                      fill="currentColor"
                      className={colors[segment]}
                    >
                      <title>
                        {`${chartIllustrations.months[index]} · ${series[segment]} · illustrative only`}
                      </title>
                    </rect>
                  );
                })}
                <text
                  x={44 + index * 56}
                  y="195"
                  textAnchor="middle"
                  className="fill-muted-foreground text-xs"
                >
                  {chartIllustrations.months[index]}
                </text>
              </g>
            ))}
          </svg>
        </section>
      ) : kind === "daily" ? (
        <svg
          role="img"
          aria-label={`${label}: illustrative daily area curve, no actual values`}
          viewBox="0 0 300 210"
          className="w-full"
        >
          <title>{`${label} — synthetic illustration`}</title>
          {[40, 80, 120, 160].map((y) => (
            <path
              key={y}
              d={`M12 ${y} H284`}
              className="stroke-border"
              fill="none"
            />
          ))}
          <path
            d={`${chartIllustrations.dailyPath} L284 170 H12 Z`}
            className="fill-accent"
          />
          <path
            d={chartIllustrations.dailyPath}
            className="stroke-primary"
            fill="none"
            strokeWidth="2"
          />
          {[1, 7, 14, 21, 31].map((day, index) => (
            <text
              key={day}
              x={12 + index * 66}
              y="195"
              className="fill-muted-foreground text-xs"
            >
              {day}
            </text>
          ))}
        </svg>
      ) : (
        <svg
          role="img"
          aria-label={`${label}: illustrative ring chart, proportions are not data`}
          viewBox="0 0 300 210"
          className="w-full"
        >
          <title>{`${label} — synthetic illustration`}</title>
          <circle
            cx="150"
            cy="100"
            r="65"
            fill="none"
            strokeWidth="28"
            className="stroke-chart-2"
          />
          <circle
            cx="150"
            cy="100"
            r="65"
            fill="none"
            strokeWidth="28"
            pathLength="100"
            strokeDasharray={kind === "invoices" ? "36 64" : "58 42"}
            transform="rotate(-90 150 100)"
            className="stroke-chart-1"
          />
          {kind === "sales" && (
            <>
              <circle
                cx="150"
                cy="100"
                r="65"
                fill="none"
                strokeWidth="28"
                pathLength="100"
                strokeDasharray="10 90"
                strokeDashoffset="-84"
                transform="rotate(-90 150 100)"
                className="stroke-chart-3"
              />
              <circle
                cx="150"
                cy="100"
                r="65"
                fill="none"
                strokeWidth="28"
                pathLength="100"
                strokeDasharray="6 94"
                strokeDashoffset="-94"
                transform="rotate(-90 150 100)"
                className="stroke-chart-4"
              />
            </>
          )}
          <text
            x="150"
            y="105"
            textAnchor="middle"
            className="fill-muted-foreground text-xs"
          >
            Preview only
          </text>
        </svg>
      )}
      {kind !== "daily" && (
        <ul
          aria-label={`${label} legend`}
          className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground"
        >
          {labels.map((item, index) => (
            <li key={item} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={`${colors[index]} size-2 rounded-full bg-current`}
              />
              {item}
            </li>
          ))}
        </ul>
      )}
      <figcaption className="text-xs leading-5 text-muted-foreground">
        Reporting queries and approved definitions are pending. Filters do not
        recalculate these illustrations.
      </figcaption>
    </figure>
  );
}
