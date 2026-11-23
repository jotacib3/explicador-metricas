import Anthropic from "@anthropic-ai/sdk";
import { runPipeline } from "@/lib/ai/pipeline";
import { ExplainRequest, type StreamEvent } from "@/lib/schemas";

export const maxDuration = 60; // Vercel: hasta 3 llamadas a la IA en serie

function errorMessage(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) return "La clave de la API no es válida o falta.";
  if (err instanceof Anthropic.RateLimitError) return "Demasiadas solicitudes; intenta en unos segundos.";
  if (err instanceof Anthropic.NotFoundError) return "El modelo configurado no existe (revisa ANTHROPIC_MODEL).";
  if (err instanceof Anthropic.APIError) return `Error de la API (${err.status ?? "red"}).`;
  return err instanceof Error ? err.message : "Error inesperado.";
}

/** Responde un stream NDJSON: un evento JSON por línea (etapas, intentos y resultado final). */
export async function POST(request: Request) {
  const parsed = ExplainRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (e: StreamEvent) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      try {
        await runPipeline(parsed.data, emit);
      } catch (err) {
        console.error("[api/explain]", err);
        emit({ type: "error", message: errorMessage(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
