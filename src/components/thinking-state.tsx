import { Check } from "lucide-react";
import type { Stage } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const STEPS: { stage: Stage; label: string }[] = [
  { stage: "explicando", label: "Escribiendo la explicación" },
  { stage: "revisando", label: "El revisor la está checando" },
  { stage: "regenerando", label: "Corrigiendo con el feedback" },
  { stage: "revisando-de-nuevo", label: "Segunda revisión" },
];

export function ThinkingState({ stage }: { stage: Stage }) {
  const current = STEPS.findIndex((s) => s.stage === stage);
  // Las etapas de regeneración solo aparecen si de verdad ocurren.
  const visible = STEPS.filter((_, i) => i < 2 || i <= current);

  return (
    <div className="rise rounded-3xl border bg-card p-5">
      <div className="flex items-center gap-3">
        <span className="relative grid size-9 place-items-center">
          <span className="orbit absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary" />
          <span className="size-2 rounded-full bg-primary" />
        </span>
        <p className="text-lg font-semibold">La IA está pensando…</p>
      </div>

      <ol className="mt-4 space-y-2">
        {visible.map((s) => {
          const i = STEPS.indexOf(s);
          const done = i < current;
          const active = i === current;
          return (
            <li key={s.stage} className={cn("rise flex items-center gap-2.5 text-sm", !done && !active && "opacity-40")}>
              <span
                className={cn(
                  "grid size-5 place-items-center rounded-full border",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && "border-primary",
                )}
              >
                {done ? <Check className="size-3" /> : active && <span className="size-1.5 animate-pulse rounded-full bg-primary" />}
              </span>
              {s.label}
            </li>
          );
        })}
      </ol>

      <div className="mt-5 space-y-2.5" aria-hidden>
        <div className="shimmer h-5 w-3/4 rounded-md" />
        <div className="shimmer h-3.5 w-full rounded-md" />
        <div className="shimmer h-3.5 w-11/12 rounded-md" />
        <div className="shimmer h-3.5 w-2/3 rounded-md" />
      </div>
    </div>
  );
}
