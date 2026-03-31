import { getRequiredEnv } from "./env.js";
import { HttpGenerationProvider, type HttpFetcher } from "./httpGenerationProvider.js";
import { buildProviderPrompt } from "./prompt.js";
import type { GenerationProvider, ProviderRequest, ProviderResponse } from "./provider.js";

type OpenAIOptions = {
  apiKeyEnv?: string;
  baseUrl?: string;
  fetcher?: HttpFetcher;
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
    const provider = new HttpGenerationProvider<{
      output_text?: string;
    }>({
      providerId: this.id,
      model: this.model,
      baseUrl,
      endpoint: "/responses",
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      body: () => ({
        model: this.model,
        input: buildProviderPrompt(request)
      }),
      parseResponse: (json) => ({
        content: json.output_text ?? "No output_text returned by OpenAI responses API."
      }),
      fetcher: this.options.fetcher
    });

    return provider.generate(request);
  }
}
