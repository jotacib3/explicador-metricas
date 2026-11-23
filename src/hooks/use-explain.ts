"use client";

import { useCallback, useRef, useState } from "react";
import type { Attempt, ExplainRequest, Stage, StreamEvent } from "@/lib/schemas";

type State =
  | { status: "idle" }
  | { status: "loading"; stage: Stage; attempts: Attempt[] }
  | { status: "done"; attempts: Attempt[]; regenerated: boolean }
  | { status: "error"; message: string };

/** Llama a /api/explain y va consumiendo el stream NDJSON de eventos. */
export function useExplain() {
  const [state, setState] = useState<State>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async (req: ExplainRequest) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ status: "loading", stage: "explicando", attempts: [] });

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error("No se pudo conectar con el servidor.");

      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines.filter(Boolean)) handle(JSON.parse(line) as StreamEvent);
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      setState({ status: "error", message: err instanceof Error ? err.message : "Error inesperado." });
    }

    function handle(e: StreamEvent) {
      setState((prev) => {
        switch (e.type) {
          case "stage":
            return prev.status === "loading" ? { ...prev, stage: e.stage } : prev;
          case "attempt":
            return prev.status === "loading" ? { ...prev, attempts: [...prev.attempts, e.attempt] } : prev;
          case "done":
            return { status: "done", attempts: e.attempts, regenerated: e.regenerated };
          case "error":
            return { status: "error", message: e.message };
        }
      });
    }
  }, []);

  return { state, run };
}
