import { z } from "zod";

/* ---------- Dominio ---------- */

export const MetricKey = z.enum(["pe", "netMargin", "roe", "debtToEquity", "dividendYield"]);
export type MetricKey = z.infer<typeof MetricKey>;

export const Level = z.enum(["principiante", "avanzado"]);
export type Level = z.infer<typeof Level>;

const MetricValues = z.record(MetricKey, z.number());

const Rival = z.object({
  name: z.string(),
  ticker: z.string(),
  metrics: MetricValues,
});

export const Company = z.object({
  id: z.string(),
  name: z.string(),
  ticker: z.string(),
  sector: z.string(),
  emoji: z.string(),
  metrics: MetricValues,
  rivals: z.array(Rival).length(2),
});
export type Company = z.infer<typeof Company>;

export const Dataset = z.object({
  disclaimer: z.string(),
  companies: z.array(Company).min(1),
});

/* ---------- Petición del cliente ---------- */

export const ExplainRequest = z.object({
  companyId: z.string(),
  metric: MetricKey,
  level: Level,
  /** Modo demo: el primer borrador incluye un error a propósito para ver al revisor actuar. */
  demoFlaw: z.boolean().default(false),
});
export type ExplainRequest = z.infer<typeof ExplainRequest>;

/* ---------- Salidas estructuradas de la IA ----------
 * Se usan como `input_schema` de una herramienta con `strict: true`, así que:
 * objetos estrictos (additionalProperties: false), todos los campos requeridos
 * y sin restricciones numéricas/de longitud.
 */

export const Explanation = z.strictObject({
  titulo: z.string().describe("Titular corto y cercano (máx. 8 palabras)."),
  queEs: z.string().describe("Qué es la métrica, en 1–2 frases sencillas."),
  queSignifica: z
    .string()
    .describe("Qué significa ESE número para ESA empresa: ¿se ve bien, regular o mal y por qué?"),
  comparacion: z.string().describe("Cómo se compara con los 2 rivales, usando sus cifras."),
  enCorto: z.string().describe("Una frase final para llevarse, sin recomendar comprar ni vender."),
});
export type Explanation = z.infer<typeof Explanation>;

export const LightColor = z.enum(["verde", "amarillo", "rojo"]);
export type LightColor = z.infer<typeof LightColor>;

const Criterion = z.strictObject({
  estado: LightColor,
  razon: z.string().describe("Explicación breve (1–2 frases) del veredicto, citando el fragmento problemático si lo hay."),
});

export const Review = z.strictObject({
  correcta: Criterion.describe("¿Usa solo los datos dados, sin inventar cifras ni hechos?"),
  clara: Criterion.describe("¿La entiende alguien del nivel indicado, sin tecnicismos innecesarios?"),
  noRecomendacion: Criterion.describe(
    "¿Evita decir compra/vende/mantén, recomendar o prometer rendimientos?",
  ),
});
export type Review = z.infer<typeof Review>;

export const CRITERIA = ["correcta", "clara", "noRecomendacion"] as const;
export type CriterionKey = (typeof CRITERIA)[number];

export function failedCriteria(review: Review): CriterionKey[] {
  return CRITERIA.filter((c) => review[c].estado === "rojo");
}

/* ---------- Respuesta (stream NDJSON) ---------- */

export const Stage = z.enum(["explicando", "revisando", "regenerando", "revisando-de-nuevo"]);
export type Stage = z.infer<typeof Stage>;

export type Attempt = { explanation: Explanation; review: Review };

export type StreamEvent =
  | { type: "stage"; stage: Stage }
  | { type: "attempt"; attempt: Attempt; index: number }
  | { type: "done"; attempts: Attempt[]; regenerated: boolean }
  | { type: "error"; message: string };
