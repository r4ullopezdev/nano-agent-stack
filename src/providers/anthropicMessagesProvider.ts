import { getRequiredEnv } from "./env.js";
import type { GenerationProvider, ProviderRequest, ProviderResponse } from "./provider.js";

type AnthropicOptions = {
  apiKeyEnv?: string;
  baseUrl?: string;
  maxTokens?: number;
};

export class AnthropicMessagesProvider implements GenerationProvider {
  readonly id = "anthropic-messages";

  constructor(
    readonly model: string,
    private readonly options: AnthropicOptions = {}
  ) {}

  async generate(request: ProviderRequest): Promise<ProviderResponse> {
    const apiKey = getRequiredEnv(this.options.apiKeyEnv ?? "ANTHROPIC_API_KEY");
    const baseUrl = this.options.baseUrl ?? "https://api.anthropic.com/v1";
    const prompt = [
      `Role: ${request.role}`,
      `Task: ${request.task}`,
      `Objective: ${request.objective}`,
      `Context: ${JSON.stringify(request.context)}`
    ].join("\n");

    const response = await fetch(`${baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: this.options.maxTokens ?? 300,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic provider request failed with status ${response.status}.`);
    }

    const json = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };

    const text = json.content?.find((entry) => entry.type === "text")?.text;

    return {
      content: text ?? "No text block returned by Anthropic messages API."
    };
  }
}

