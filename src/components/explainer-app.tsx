"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useExplain } from "@/hooks/use-explain";
import { COMPANIES, DISCLAIMER, METRICS, formatMetric } from "@/lib/data";
import { failedCriteria, MetricKey, type Attempt, type Level } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { ComparisonBars } from "./comparison-bars";
import { ExplanationCard } from "./explanation-card";
import { ReviewLights } from "./review-lights";
import { ThinkingState } from "./thinking-state";

const METRIC_KEYS = MetricKey.options;
const LEVELS: { value: Level; label: string }[] = [
  { value: "principiante", label: "Principiante" },
  { value: "avanzado", label: "Avanzado" },
];

export function ExplainerApp() {
  const [companyId, setCompanyId] = useState(COMPANIES[0].id);
  const [metric, setMetric] = useState<MetricKey>("pe");
  const [level, setLevel] = useState<Level>("principiante");
  const [demoFlaw, setDemoFlaw] = useState(false);
  const { state, run } = useExplain();
  const resultRef = useRef<HTMLDivElement>(null);

  const company = COMPANIES.find((c) => c.id === companyId)!;
  const loading = state.status === "loading";

  useEffect(() => {
    if (loading) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [loading]);

  return (
    <div className="flex flex-col gap-6">
      <header className="rise">
        <Badge variant="outline" className="mb-3 border-primary/40 text-primary">
          Prototipo
        </Badge>
        <h1 className="text-[2rem] leading-[1.1] font-extrabold tracking-tight">
          Explicador de métricas
          <span className="mt-1 block text-xl font-semibold text-muted-foreground">· prototipo</span>
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Elige una empresa y una métrica. Una IA te la explica sin rollos y otra IA revisa que sea correcta, clara y que no
          sea una recomendación.
        </p>
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--light-yellow)]/12 px-3 py-1 text-xs font-medium text-[var(--light-yellow)]">
          ⚠️ {DISCLAIMER.split(".")[0]}
        </p>
      </header>

      {/* 1. Empresa */}
      <section className="rise" style={{ animationDelay: "60ms" }}>
        <StepTitle n={1}>Empresa</StepTitle>
        <div className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1">
          {COMPANIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCompanyId(c.id)}
              className={cn(
                "flex shrink-0 snap-start items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-left transition",
                c.id === companyId ? "border-primary bg-primary/10" : "bg-card hover:bg-accent",
              )}
            >
              <span className="text-xl">{c.emoji}</span>
              <span>
                <span className="block text-sm leading-tight font-semibold">{c.name}</span>
                <span className="block text-xs text-muted-foreground">{c.sector}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 2. Métrica */}
      <section className="rise" style={{ animationDelay: "120ms" }}>
        <StepTitle n={2}>Métrica</StepTitle>
        <div className="grid grid-cols-2 gap-2">
          {METRIC_KEYS.map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={cn(
                "rounded-2xl border p-3 text-left transition last:col-span-2",
                m === metric ? "border-primary bg-primary/10" : "bg-card hover:bg-accent",
              )}
            >
              <span className="block text-sm font-semibold">{METRICS[m].short}</span>
              <span className="font-mono text-lg tabular-nums">{formatMetric(m, company.metrics[m])}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 3. Nivel + modo demo */}
      <section className="rise space-y-3" style={{ animationDelay: "180ms" }}>
        <StepTitle n={3}>Nivel</StepTitle>
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1">
          {LEVELS.map((l) => (
            <button
              key={l.value}
              onClick={() => setLevel(l.value)}
              className={cn(
                "rounded-xl py-2.5 text-sm font-semibold transition",
                level === l.value ? "bg-background text-foreground shadow" : "text-muted-foreground",
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-dashed p-3">
          <Label htmlFor="demo" className="flex-col items-start gap-0.5">
            <span className="text-sm font-semibold">Probar al revisor</span>
            <span className="text-xs font-normal text-muted-foreground">
              El primer borrador trae un error a propósito
            </span>
          </Label>
          <Switch id="demo" checked={demoFlaw} onCheckedChange={setDemoFlaw} />
        </div>
      </section>

      <Button
        size="lg"
        disabled={loading}
        onClick={() => run({ companyId, metric, level, demoFlaw })}
        className="h-14 rounded-2xl text-lg font-bold shadow-[0_8px_30px_-8px_var(--primary)]"
      >
        <Sparkles className="size-5" />
        {loading ? "Pensando…" : "Explícamelo"}
      </Button>

      {/* Resultado */}
      <div ref={resultRef} className="scroll-mt-4 space-y-5">
        {state.status === "loading" && (
          <>
            <ThinkingState stage={state.stage} />
            {state.attempts[0] && failedCriteria(state.attempts[0].review).length > 0 && (
              <Rejection attempt={state.attempts[0]} />
            )}
          </>
        )}

        {state.status === "error" && (
          <div className="rise rounded-2xl border border-[var(--light-red)]/40 bg-[var(--light-red)]/10 p-4 text-sm">
            {state.message}
          </div>
        )}

        {state.status === "done" && (
          <Result
            key={state.attempts.length + companyId + metric}
            attempts={state.attempts}
            regenerated={state.regenerated}
            company={company}
            metric={metric}
          />
        )}
      </div>
    </div>
  );
}

function Result({
  attempts,
  regenerated,
  company,
  metric,
}: {
  attempts: Attempt[];
  regenerated: boolean;
  company: (typeof COMPANIES)[number];
  metric: MetricKey;
}) {
  const final = attempts[attempts.length - 1];
  return (
    <>
      <div className="rise rounded-3xl border bg-card p-5">
        <p className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {METRICS[metric].label} · {company.sector}
        </p>
        <ComparisonBars company={company} metric={metric} />
      </div>

      <ExplanationCard explanation={final.explanation} />

      <section className="space-y-3">
        <h2 className="flex items-center justify-between text-lg font-bold">
          Semáforo del revisor
          {regenerated && (
            <Badge variant="secondary" className="gap-1">
              <RotateCcw className="size-3" /> Regenerada 1 vez
            </Badge>
          )}
        </h2>
        {regenerated && <Rejection attempt={attempts[0]} done />}
        <ReviewLights review={final.review} />
      </section>
    </>
  );
}

/** Aviso de que el revisor rechazó el primer borrador, con las razones en rojo. */
function Rejection({ attempt, done = false }: { attempt: Attempt; done?: boolean }) {
  const reds = failedCriteria(attempt.review);
  return (
    <div className="rise rounded-2xl border border-[var(--light-red)]/40 bg-[var(--light-red)]/10 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-[var(--light-red)]">
        <span className="light-on size-2.5 rounded-full bg-[var(--light-red)] shadow-[0_0_12px_var(--light-red)]" />
        {done ? "Primer borrador rechazado" : "El revisor detectó un problema"}
      </p>
      <ul className="mt-1.5 space-y-1 text-sm leading-snug text-foreground/85">
        {reds.map((c) => (
          <li key={c}>{attempt.review[c].razon}</li>
        ))}
      </ul>
      {done && <p className="mt-2 text-xs text-muted-foreground">Se regeneró con ese feedback. Abajo, la revisión final.</p>}
    </div>
  );
}

function StepTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h2 className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
      <span className="grid size-5 place-items-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
        {n}
      </span>
      {children}
    </h2>
  );
}
