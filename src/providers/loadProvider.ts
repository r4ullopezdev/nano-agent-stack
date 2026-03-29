import type { ProviderConfig } from "../types.js";
import { EchoProvider } from "./echoProvider.js";
import type { GenerationProvider } from "./provider.js";
import { StaticScenarioProvider } from "./staticScenarioProvider.js";

export function loadProvider(config: ProviderConfig): GenerationProvider {
  switch (config.kind) {
    case "static-scenario":
      return new StaticScenarioProvider(config.model);
    case "echo":
      return new EchoProvider(config.model);
    default:
      throw new Error(`Unsupported provider '${String(config.kind)}'.`);
  }
}
