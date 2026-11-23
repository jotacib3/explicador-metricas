import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { getClient, getEffort, getModel } from "./client";

type StructuredCall<S extends z.ZodType> = {
  system: string;
  user: string;
  schema: S;
  toolName: string;
  toolDescription: string;
};

/** Convierte un esquema Zod en el `input_schema` (JSON Schema) de una herramienta. */
function toInputSchema(schema: z.ZodType): Anthropic.Tool.InputSchema {
  const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
  delete jsonSchema.$schema; // metadato del draft; la API no lo necesita
  return { ...jsonSchema, type: "object" };
}

/**
 * Salida estructurada vía tool use:
 *  - una sola herramienta con `strict: true` cuyo esquema se genera desde Zod,
 *  - el prompt le pide al modelo que la llame (tool_choice queda en "auto": los modelos
 *    más nuevos no aceptan forzar la herramienta),
 *  - validamos el `input` con el mismo esquema Zod y reintentamos una vez si no llega.
 */
export async function callStructured<S extends z.ZodType>(call: StructuredCall<S>): Promise<z.infer<S>> {
  const tool: Anthropic.Tool = {
    name: call.toolName,
    description: call.toolDescription,
    input_schema: toInputSchema(call.schema),
    strict: true,
  };
  const effort = getEffort();

  const messages: Anthropic.MessageParam[] = [{ role: "user", content: call.user }];
  let lastProblem = "";

  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await getClient().messages.create({
      model: getModel(),
      max_tokens: 8000,
      system: call.system,
      tools: [tool],
      messages,
      ...(effort ? { output_config: { effort } } : {}),
    });

    if (response.stop_reason === "refusal") {
      throw new Error("El modelo declinó responder esta solicitud.");
    }

    const toolUse = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === call.toolName,
    );

    if (toolUse) {
      const parsed = call.schema.safeParse(toolUse.input);
      if (parsed.success) return parsed.data;
      lastProblem = `La salida no cumplió el esquema: ${z.prettifyError(parsed.error)}`;
    } else {
      lastProblem = `El modelo no llamó a la herramienta (stop_reason: ${response.stop_reason}).`;
    }

    // Reintento: conservamos la respuesta y pedimos explícitamente la herramienta.
    if (toolUse) {
      messages.push(
        { role: "assistant", content: response.content },
        {
          role: "user",
          content: [
            { type: "tool_result", tool_use_id: toolUse.id, is_error: true, content: lastProblem },
            { type: "text", text: `Vuelve a llamar a "${call.toolName}" con datos válidos.` },
          ],
        },
      );
    } else {
      messages.push(
        { role: "assistant", content: response.content },
        { role: "user", content: `Responde únicamente llamando a la herramienta "${call.toolName}".` },
      );
    }
  }

  throw new Error(lastProblem || "No se obtuvo una salida estructurada válida.");
}
