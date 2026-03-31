import { describe, expect, test } from "vitest";
import { toRunRecord } from "../src/observability/toRunRecord.js";
import { AnthropicMessagesProvider } from "../src/providers/anthropicMessagesProvider.js";
import { loadProvider } from "../src/providers/loadProvider.js";
import { OpenAIResponsesProvider } from "../src/providers/openaiResponsesProvider.js";
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
      approvals: [],
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

  test("openai experimental provider formats requests and parses responses", async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const provider = new OpenAIResponsesProvider("gpt-4.1-mini", {
      apiKeyEnv: "TEST_OPENAI_API_KEY",
      fetcher: async (url, init) => {
        requests.push({ url: String(url), init });
        return new Response(JSON.stringify({ output_text: "provider-ok" }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
    });

    process.env.TEST_OPENAI_API_KEY = "test-key";

    const result = await provider.generate({
      agentId: "worker",
      role: "Research Worker",
      task: "Summarize checkpoint handling",
      objective: "Produce a short note.",
      context: { checkpoint: true }
    });

    expect(result.content).toBe("provider-ok");
    expect(requests[0]?.url).toContain("/responses");
    expect(JSON.stringify(requests[0]?.init?.headers)).toContain("Authorization");
    delete process.env.TEST_OPENAI_API_KEY;
  });

  test("anthropic experimental provider formats requests and parses responses", async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const provider = new AnthropicMessagesProvider("claude-3-5-sonnet-latest", {
      apiKeyEnv: "TEST_ANTHROPIC_API_KEY",
      fetcher: async (url, init) => {
        requests.push({ url: String(url), init });
        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: "anthropic-ok" }]
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
    });

    process.env.TEST_ANTHROPIC_API_KEY = "test-key";

    const result = await provider.generate({
      agentId: "worker",
      role: "Research Worker",
      task: "Summarize provider isolation",
      objective: "Produce a short note.",
      context: { provider: "anthropic" }
    });

    expect(result.content).toBe("anthropic-ok");
    expect(requests[0]?.url).toContain("/messages");
    expect(JSON.stringify(requests[0]?.init?.headers)).toContain("anthropic-version");
    delete process.env.TEST_ANTHROPIC_API_KEY;
  });
});
