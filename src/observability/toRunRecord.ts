import { createEvent, type RunRecord } from "nano-agent-observability";
import type { RunResult } from "../types.js";

export function toRunRecord(result: RunResult): RunRecord {
  const startedAt = result.trace[0]?.at ?? new Date().toISOString();
  const finishedAt = result.trace.at(-1)?.at ?? startedAt;

  return {
    runId: `${result.workflow}-${finishedAt.replace(/[:.]/g, "-")}`,
    workflow: result.workflow,
    startedAt,
    finishedAt,
    status: "completed",
    events: result.trace.map((event) =>
      createEvent(event.type, event.actor, event.detail, event.payload, "info")
    )
  };
}
