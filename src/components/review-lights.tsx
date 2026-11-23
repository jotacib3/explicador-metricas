import { CRITERIA, type CriterionKey, type LightColor, type Review } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const LABELS: Record<CriterionKey, { title: string; hint: string }> = {
  correcta: { title: "Correcta", hint: "Solo usa los datos dados" },
  clara: { title: "Clara", hint: "Sin tecnicismos" },
  noRecomendacion: { title: "No es recomendación", hint: "Ni compra/vende ni promesas" },
};

const COLOR: Record<LightColor, { dot: string; text: string; label: string }> = {
  verde: { dot: "bg-[var(--light-green)] shadow-[0_0_18px_var(--light-green)]", text: "text-[var(--light-green)]", label: "Verde" },
  amarillo: { dot: "bg-[var(--light-yellow)] shadow-[0_0_18px_var(--light-yellow)]", text: "text-[var(--light-yellow)]", label: "Amarillo" },
  rojo: { dot: "bg-[var(--light-red)] shadow-[0_0_18px_var(--light-red)]", text: "text-[var(--light-red)]", label: "Rojo" },
};

export function ReviewLights({ review, compact = false }: { review: Review; compact?: boolean }) {
  return (
    <ul className="space-y-2.5">
      {CRITERIA.map((key, i) => {
        const { estado, razon } = review[key];
        const c = COLOR[estado];
        return (
          <li
            key={key}
            className="rise flex gap-3 rounded-2xl border bg-card/60 p-3.5"
            style={{ animationDelay: `${i * 140}ms` }}
          >
            <span
              className={cn("light-on mt-1 size-3.5 shrink-0 rounded-full", c.dot)}
              style={{ animationDelay: `${i * 140 + 120}ms` }}
              aria-hidden
            />
            <div className="min-w-0">
              <p className="flex flex-wrap items-baseline gap-x-2 text-[15px] font-semibold">
                {LABELS[key].title}
                <span className={cn("text-xs font-medium uppercase tracking-wide", c.text)}>{c.label}</span>
              </p>
              {!compact && <p className="text-xs text-muted-foreground">{LABELS[key].hint}</p>}
              <p className="mt-1 text-sm leading-snug text-foreground/85">{razon}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
