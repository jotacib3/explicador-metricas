import { Explanation, type Level } from "@/lib/schemas";
import { EXPLAINER_SYSTEM, explainerUserPrompt } from "./prompts/explainer";
import { callStructured } from "./structured";

export function explain(args: {
  companyName: string;
  dataContext: string;
  level: Level;
  feedback?: string;
}): Promise<Explanation> {
  return callStructured({
    system: EXPLAINER_SYSTEM,
    user: explainerUserPrompt(args),
    schema: Explanation,
    toolName: "entregar_explicacion",
    toolDescription: "Entrega la explicación de la métrica, dividida en secciones.",
  });
}

/** Texto plano de la explicación (lo que lee el revisor y lo que ve el usuario). */
export function explanationToText(e: Explanation): string {
  return [e.titulo, e.queEs, e.queSignifica, e.comparacion, e.enCorto].join("\n\n");
}
