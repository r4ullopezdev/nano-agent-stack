import type { GenerationProvider, ProviderRequest, ProviderResponse } from "./provider.js";

export class EchoProvider implements GenerationProvider {
  readonly id = "echo";

  constructor(readonly model: string) {}

  async generate(request: ProviderRequest): Promise<ProviderResponse> {
    return {
      content: `[${this.model}] ${request.role} received task '${request.task}' with objective '${request.objective}'.`,
      metadata: { echoed: true }
    };
  }
}

