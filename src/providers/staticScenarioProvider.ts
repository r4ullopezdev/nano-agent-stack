import type { GenerationProvider, ProviderRequest, ProviderResponse } from "./provider.js";

export class StaticScenarioProvider implements GenerationProvider {
  readonly id = "static-scenario";

  constructor(readonly model: string) {}

  async generate(request: ProviderRequest): Promise<ProviderResponse> {
    const department = String(request.context.ownerDepartment ?? "Unknown department");
    const output = String(request.context.desiredOutput ?? "structured output");

    if (request.role.toLowerCase().includes("manager")) {
      return {
        content: `${request.role} decomposed '${request.task}' for ${department} and aligned workers on ${output}.`,
        metadata: { mode: "manager-brief" }
      };
    }

    return {
      content: `${request.role} prepared a provider-side note for '${request.task}' with target output ${output}.`,
      metadata: { mode: "worker-note" }
    };
  }
}

