import { Review, failedCriteria, type Level } from "@/lib/schemas";
import { REVIEWER_SYSTEM, reviewerUserPrompt } from "./prompts/reviewer";
import { callStructured } from "./structured";

export function review(args: { dataContext: string; level: Level; explanationText: string }): Promise<Review> {
  return callStructured({
    system: REVIEWER_SYSTEM,
    user: reviewerUserPrompt(args),
    schema: Review,
    toolName: "entregar_revision",
    toolDescription: "Entrega el semáforo de la revisión: un estado y una razón por criterio.",
  });
}

const LABELS = {
  correcta: "Correcta (solo datos dados)",
  clara: "Clara",
  noRecomendacion: "No es recomendación",
} as const;

/** Feedback legible para el explicador, solo con los criterios en rojo. */
export function feedbackFromReview(r: Review): string {
  return failedCriteria(r)
    .map((c) => `- ${LABELS[c]}: ${r[c].razon}`)
    .join("\n");
}
