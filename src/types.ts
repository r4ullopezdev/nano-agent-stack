export type SkillInput = {
  task: string;
  context: Record<string, unknown>;
};

export type SkillResult = {
  summary: string;
  data?: Record<string, unknown>;
};

export type SkillHandler = (input: SkillInput) => Promise<SkillResult> | SkillResult;

export type SkillDefinition = {
  id: string;
  description: string;
  handler: SkillHandler;
};

export type MemoryRecord = {
  key: string;
  value: unknown;
  scope?: string;
};

export type MemoryAdapter = {
  read(scope: string, key: string): Promise<unknown | undefined>;
  write(record: MemoryRecord): Promise<void>;
};

export type MemoryConfig = {
  kind: "in-memory" | "file" | "sqlite";
  options?: {
    filePath?: string;
    dbPath?: string;
    tableName?: string;
  };
};

export type ExecutionPolicy = {
  maxTasksPerRun: number;
  humanApprovalRequired: boolean;
  allowSkillFallback: boolean;
};

export type ProviderConfig = {
  kind: "static-scenario" | "echo" | "openai-responses" | "anthropic-messages";
  model: string;
  options?: Record<string, unknown>;
};

export type AgentDefinition = {
  id: string;
  role: string;
  department: string;
  skills: string[];
  instruction: string;
};

export type DepartmentDefinition = {
  id: string;
  label: string;
  manager: string;
  workers: string[];
  routingStrategy: "broadcast" | "sequential";
};

export type WorkflowTask = {
  id: string;
  title: string;
  ownerDepartment: string;
  desiredOutput: string;
  requiredSkills: string[];
  checkpoint?: string;
};

export type ApprovalRequest = {
  workflow: string;
  taskId: string;
  taskTitle: string;
  department: string;
  checkpoint: string;
  managerBrief: string;
};

export type ApprovalDecision = {
  taskId: string;
  checkpoint: string;
  approved: boolean;
  reviewer: string;
  reason?: string;
  at: string;
};

export type ApprovalHandler = {
  requestApproval(request: ApprovalRequest): Promise<ApprovalDecision>;
};

export type RuntimeConfig = {
  name: string;
  provider: ProviderConfig;
  memory?: MemoryConfig;
  policy: ExecutionPolicy;
  agents: AgentDefinition[];
  departments: DepartmentDefinition[];
  tasks: WorkflowTask[];
};

export type TraceEvent = {
  at: string;
  type:
    | "run.started"
    | "run.completed"
    | "task.started"
    | "task.completed"
    | "skill.invoked"
    | "approval.requested"
    | "approval.approved"
    | "approval.rejected";
  actor: string;
  taskId?: string;
  detail: string;
  payload?: Record<string, unknown>;
};

export type TaskResult = {
  taskId: string;
  ownerDepartment: string;
  manager: string;
  provider: string;
  status: "completed" | "blocked";
  managerBrief: string;
  workerOutputs: Array<{
    workerId: string;
    skillId: string;
    summary: string;
    providerNote: string;
  }>;
  finalSummary: string;
  approval?: ApprovalDecision;
};

export type RunResult = {
  workflow: string;
  results: TaskResult[];
  trace: TraceEvent[];
  approvals: ApprovalDecision[];
};
