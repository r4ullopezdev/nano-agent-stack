import type { GenerationProvider, ProviderRequest, ProviderResponse } from "./provider.js";

export type HttpFetcher = typeof fetch;

type HttpGenerationProviderOptions<TResponse> = {
  providerId: string;
  model: string;
  baseUrl: string;
  endpoint: string;
  headers: Record<string, string>;
  body: (request: ProviderRequest) => Record<string, unknown>;
  parseResponse: (json: TResponse) => ProviderResponse;
  fetcher?: HttpFetcher;
};

export class HttpGenerationProvider<TResponse> implements GenerationProvider {
  readonly id: string;
  readonly model: string;

  private readonly baseUrl: string;
  private readonly endpoint: string;
  private readonly headers: Record<string, string>;
  private readonly bodyBuilder: (request: ProviderRequest) => Record<string, unknown>;
  private readonly parseResponse: (json: TResponse) => ProviderResponse;
  private readonly fetcher: HttpFetcher;

  constructor(options: HttpGenerationProviderOptions<TResponse>) {
    this.id = options.providerId;
    this.model = options.model;
    this.baseUrl = options.baseUrl;
    this.endpoint = options.endpoint;
    this.headers = options.headers;
    this.bodyBuilder = options.body;
    this.parseResponse = options.parseResponse;
    this.fetcher = options.fetcher ?? fetch;
  }

  async generate(request: ProviderRequest): Promise<ProviderResponse> {
    const response = await this.fetcher(`${this.baseUrl}${this.endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.headers
      },
      body: JSON.stringify(this.bodyBuilder(request))
    });

    if (!response.ok) {
      const responseText = await response.text().catch(() => "");
      throw new Error(
        `${this.id} request failed with status ${response.status}.${responseText ? ` Response: ${responseText}` : ""}`
      );
    }

    const json = (await response.json()) as TResponse;
    return this.parseResponse(json);
  }
}
