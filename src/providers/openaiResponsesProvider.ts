import { getRequiredEnv } from "./env.js";
import type { GenerationProvider, ProviderRequest, ProviderResponse } from "./provider.js";

type OpenAIOptions = {
  apiKeyEnv?: string;
  baseUrl?: string;
};

export class OpenAIResponsesProvider implements GenerationProvider {
  readonly id = "openai-responses";

  constructor(
    readonly model: string,
    private readonly options: OpenAIOptions = {}
  ) {}

  async generate(request: ProviderRequest): Promise<ProviderResponse> {
    const apiKey = getRequiredEnv(this.options.apiKeyEnv ?? "OPENAI_API_KEY");
    const baseUrl = this.options.baseUrl ?? "https://api.openai.com/v1";
    const prompt = [
      `Role: ${request.role}`,
      `Task: ${request.task}`,
      `Objective: ${request.objective}`,
      `Context: ${JSON.stringify(request.context)}`
    ].join("\n");

    const response = await fetch(`${baseUrl}/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        input: prompt
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI provider request failed with status ${response.status}.`);
    }

    const json = (await response.json()) as {
      output_text?: string;
    };

    return {
      content: json.output_text ?? "No output_text returned by OpenAI responses API."
    };
  }
}

