import { formatMetric } from "@/lib/data";
import type { Company, MetricKey } from "@/lib/schemas";
import { cn } from "@/lib/utils";

/** Barras con las cifras reales del JSON (no vienen de la IA): empresa elegida vs. rivales. */
export function ComparisonBars({ company, metric }: { company: Company; metric: MetricKey }) {
  const rows = [
    { name: company.name, value: company.metrics[metric], main: true },
    ...company.rivals.map((r) => ({ name: r.name, value: r.metrics[metric], main: false })),
  ];
  const max = Math.max(...rows.map((r) => Math.abs(r.value)), 0.0001);

  return (
    <div className="space-y-2.5">
      {rows.map((r, i) => (
        <div key={r.name}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
            <span className={cn("truncate", r.main ? "font-semibold" : "text-muted-foreground")}>{r.name}</span>
            <span className={cn("font-mono tabular-nums", r.main && "font-semibold text-primary")}>
              {formatMetric(metric, r.value)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "grow-x h-full rounded-full",
                r.value < 0 ? "bg-[var(--light-red)]/70" : r.main ? "bg-primary" : "bg-foreground/25",
              )}
              style={{ width: `${(Math.abs(r.value) / max) * 100}%`, animationDelay: `${i * 90}ms` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
