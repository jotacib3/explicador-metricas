import type { Explanation } from "@/lib/schemas";

const SECTIONS: { key: keyof Omit<Explanation, "titulo" | "enCorto">; label: string }[] = [
  { key: "queEs", label: "¿Qué es?" },
  { key: "queSignifica", label: "¿Qué significa aquí?" },
  { key: "comparacion", label: "Contra sus rivales" },
];

export function ExplanationCard({ explanation }: { explanation: Explanation }) {
  return (
    <article className="rise rounded-3xl border bg-card p-5">
      <h2 className="text-2xl leading-tight font-bold tracking-tight text-balance">{explanation.titulo}</h2>
      <div className="mt-4 space-y-4">
        {SECTIONS.map((s, i) => (
          <section key={s.key} className="rise" style={{ animationDelay: `${120 + i * 110}ms` }}>
            <h3 className="text-xs font-semibold tracking-wider text-primary uppercase">{s.label}</h3>
            <p className="mt-1 text-[17px] leading-relaxed text-foreground/90">{explanation[s.key]}</p>
          </section>
        ))}
      </div>
      <p
        className="rise mt-5 rounded-2xl bg-primary/10 p-4 text-[17px] leading-snug font-medium"
        style={{ animationDelay: "480ms" }}
      >
        💡 {explanation.enCorto}
      </p>
    </article>
  );
}
