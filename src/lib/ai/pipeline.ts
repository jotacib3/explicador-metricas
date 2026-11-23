import { buildDataContext, getCompany } from "@/lib/data";
import { failedCriteria, type Attempt, type ExplainRequest, type StreamEvent } from "@/lib/schemas";
import { injectDemoFlaw } from "./demo";
import { explain, explanationToText } from "./explainer";
import { feedbackFromReview, review } from "./reviewer";

/**
 * Explicador → Revisor → (si algún criterio sale en rojo) una sola regeneración con el feedback.
 * Emite eventos para que la UI muestre en qué etapa va.
 */
export async function runPipeline(req: ExplainRequest, emit: (e: StreamEvent) => void): Promise<void> {
  const company = getCompany(req.companyId);
  if (!company) throw new Error(`Empresa desconocida: ${req.companyId}`);

  const dataContext = buildDataContext(company, req.metric);
  const attempts: Attempt[] = [];

  const runAttempt = async (feedback?: string) => {
    let explanation = await explain({ companyName: company.name, dataContext, level: req.level, feedback });
    if (req.demoFlaw && !feedback) explanation = injectDemoFlaw(explanation);
    emit({ type: "stage", stage: feedback ? "revisando-de-nuevo" : "revisando" });
    const verdict = await review({ dataContext, level: req.level, explanationText: explanationToText(explanation) });
    const attempt = { explanation, review: verdict };
    attempts.push(attempt);
    emit({ type: "attempt", attempt, index: attempts.length - 1 });
    return attempt;
  };

  emit({ type: "stage", stage: "explicando" });
  const first = await runAttempt();

  if (failedCriteria(first.review).length > 0) {
    emit({ type: "stage", stage: "regenerando" });
    await runAttempt(feedbackFromReview(first.review));
  }

  emit({ type: "done", attempts, regenerated: attempts.length > 1 });
}
