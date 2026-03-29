export type ProviderRequest = {
  agentId: string;
  role: string;
  task: string;
  objective: string;
  context: Record<string, unknown>;
};

export type ProviderResponse = {
  content: string;
  metadata?: Record<string, unknown>;
};

export interface GenerationProvider {
  readonly id: string;
  readonly model: string;
  generate(request: ProviderRequest): Promise<ProviderResponse>;
}

