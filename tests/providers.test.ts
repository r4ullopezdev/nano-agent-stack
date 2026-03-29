import { describe, expect, test } from "vitest";
import { toRunRecord } from "../src/observability/toRunRecord.js";
import { loadProvider } from "../src/providers/loadProvider.js";
import type { RunResult } from "../src/types.js";

describe("provider loading", () => {
  test("loads local deterministic providers", () => {
    const provider = loadProvider({ kind: "static-scenario", model: "demo-model" });
    expect(provider.id).toBe("static-scenario");
  });

  test("converts run results into observability records", () => {
    const result: RunResult = {
      workflow: "demo-flow",
      results: [],
      trace: [
        {
          at: "2026-03-29T00:00:00.000Z",
          type: "run.started",
          actor: "orchestrator",
          detail: "Started."
        },
        {
          at: "2026-03-29T00:00:01.000Z",
          type: "run.completed",
          actor: "orchestrator",
          detail: "Completed."
        }
      ]
    };

    const runRecord = toRunRecord(result);
    expect(runRecord.workflow).toBe("demo-flow");
    expect(runRecord.events).toHaveLength(2);
    expect(runRecord.status).toBe("completed");
  });
});
