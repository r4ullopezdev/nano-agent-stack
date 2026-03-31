import type { ProviderRequest } from "./provider.js";

export function buildProviderPrompt(request: ProviderRequest): string {
  return [
    `Role: ${request.role}`,
    `Task: ${request.task}`,
    `Objective: ${request.objective}`,
    `Context: ${JSON.stringify(request.context)}`
  ].join("\n");
}
