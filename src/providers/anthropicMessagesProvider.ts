import { getRequiredEnv } from "./env.js";
import { HttpGenerationProvider, type HttpFetcher } from "./httpGenerationProvider.js";
import { buildProviderPrompt } from "./prompt.js";
import type { GenerationProvider, ProviderRequest, ProviderResponse } from "./provider.js";

type AnthropicOptions = {
  apiKeyEnv?: string;
  baseUrl?: string;
  maxTokens?: number;
  fetcher?: HttpFetcher;
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
    const provider = new HttpGenerationProvider<{
      content?: Array<{ type: string; text?: string }>;
    }>({
      providerId: this.id,
      model: this.model,
      baseUrl,
      endpoint: "/messages",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: () => ({
        model: this.model,
        max_tokens: this.options.maxTokens ?? 300,
        messages: [
          {
            role: "user",
            content: buildProviderPrompt(request)
          }
        ]
      }),
      parseResponse: (json) => ({
        content:
          json.content?.find((entry) => entry.type === "text")?.text ??
          "No text block returned by Anthropic messages API."
      }),
      fetcher: this.options.fetcher
    });

    return provider.generate(request);
  }
}
