import type { ProviderConfig } from "../types.js";
import { AnthropicMessagesProvider } from "./anthropicMessagesProvider.js";
import { EchoProvider } from "./echoProvider.js";
import { OpenAIResponsesProvider } from "./openaiResponsesProvider.js";
import type { GenerationProvider } from "./provider.js";
import { StaticScenarioProvider } from "./staticScenarioProvider.js";

export function loadProvider(config: ProviderConfig): GenerationProvider {
  switch (config.kind) {
    case "static-scenario":
      return new StaticScenarioProvider(config.model);
    case "echo":
      return new EchoProvider(config.model);
    case "openai-responses":
      return new OpenAIResponsesProvider(config.model, config.options);
    case "anthropic-messages":
      return new AnthropicMessagesProvider(config.model, config.options);
    default:
      throw new Error(`Unsupported provider '${String(config.kind)}'.`);
  }
}
