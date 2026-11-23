import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | undefined;

/** Cliente perezoso: lee ANTHROPIC_API_KEY del entorno (.env.local en local, variables en Vercel). */
export function getClient(): Anthropic {
  client ??= new Anthropic();
  return client;
}

/** El modelo SIEMPRE viene del entorno; no se hardcodea. */
export function getModel(): string {
  const model = process.env.ANTHROPIC_MODEL;
  if (!model) {
    throw new Error("Falta ANTHROPIC_MODEL en el entorno (ver .env.example).");
  }
  return model;
}

const EFFORTS = ["low", "medium", "high", "xhigh", "max"] as const;
type Effort = (typeof EFFORTS)[number];

/** Esfuerzo opcional (ANTHROPIC_EFFORT). Si no se define, se usa el default del modelo. */
export function getEffort(): Effort | undefined {
  const value = process.env.ANTHROPIC_EFFORT;
  return EFFORTS.find((e) => e === value);
}
