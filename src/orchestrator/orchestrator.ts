import { RunTracer } from "../observability/tracer.js";
import type { GenerationProvider } from "../providers/provider.js";
import type {
  AgentDefinition,
  ApprovalDecision,
  ApprovalHandler,
  DepartmentDefinition,
  MemoryAdapter,
  RunResult,
  RuntimeConfig,
  TaskResult,
  WorkflowTask
} from "../types.js";
import type { SkillRegistry } from "nano-agent-skills";

type RuntimeDependencies = {
  config: RuntimeConfig;
  skills: SkillRegistry;
  memory: MemoryAdapter;
  provider: GenerationProvider;
  approval?: ApprovalHandler;
};

export class Orchestrator {
  private readonly tracer = new RunTracer();

  constructor(private readonly deps: RuntimeDependencies) {}

  async run(): Promise<RunResult> {
    const { config } = this.deps;
    const approvals: ApprovalDecision[] = [];

    this.tracer.record({
      type: "run.started",
      actor: "orchestrator",
      detail: `Starting workflow '${config.name}'.`
    });

    if (config.tasks.length > config.policy.maxTasksPerRun) {
      throw new Error("Task count exceeds configured execution policy.");
    }

    const results: TaskResult[] = [];
    for (const task of config.tasks) {
      const result = await this.executeTask(task);
      if (result.approval) {
        approvals.push(result.approval);
      }
      results.push(result);
    }

    this.tracer.record({
      type: "run.completed",
      actor: "orchestrator",
      detail: `Completed workflow '${config.name}'.`,
      payload: { resultCount: results.length }
    });

    return {
      workflow: config.name,
      results,
      trace: this.tracer.list(),
      approvals
    };
  }

  private getDepartment(id: string): DepartmentDefinition {
    const department = this.deps.config.departments.find((entry) => entry.id === id);
    if (!department) {
      throw new Error(`Department '${id}' not found.`);
    }
    return department;
  }

  private getAgent(id: string): AgentDefinition {
    const agent = this.deps.config.agents.find((entry) => entry.id === id);
    if (!agent) {
      throw new Error(`Agent '${id}' not found.`);
    }
    return agent;
  }

  private async executeTask(task: WorkflowTask): Promise<TaskResult> {
    const department = this.getDepartment(task.ownerDepartment);
    const manager = this.getAgent(department.manager);
    const managerContext = {
      desiredOutput: task.desiredOutput,
      ownerDepartment: department.label,
      managerInstruction: manager.instruction
    };
    const managerBrief = await this.deps.provider.generate({
      agentId: manager.id,
      role: manager.role,
      task: task.title,
      objective: "Plan work decomposition and route execution.",
      context: managerContext
    });

    this.tracer.record({
      type: "task.started",
      actor: manager.id,
      taskId: task.id,
      detail: `Manager '${manager.role}' accepted task '${task.title}'.`,
      payload: { provider: this.deps.provider.id }
    });

    let approval: ApprovalDecision | undefined;
    if (task.checkpoint && this.deps.config.policy.humanApprovalRequired) {
      this.tracer.record({
        type: "approval.requested",
        actor: manager.id,
        taskId: task.id,
        detail: task.checkpoint,
        payload: { checkpoint: task.checkpoint }
      });

      approval = await this.requestApproval(task, department.label, managerBrief.content);
      this.tracer.record({
        type: approval.approved ? "approval.approved" : "approval.rejected",
        actor: approval.reviewer,
        taskId: task.id,
        detail: approval.reason ?? task.checkpoint,
        payload: { checkpoint: approval.checkpoint }
      });

      if (!approval.approved) {
        const finalSummary = `Task '${task.title}' was blocked at human checkpoint '${task.checkpoint}'.`;

        await this.deps.memory.write({
          scope: task.ownerDepartment,
          key: `${task.id}:approval`,
          value: approval
        });

        this.tracer.record({
          type: "task.completed",
          actor: manager.id,
          taskId: task.id,
          detail: `Task '${task.title}' blocked after rejection.`,
          payload: { workerCount: 0, status: "blocked" }
        });

        return {
          taskId: task.id,
          ownerDepartment: task.ownerDepartment,
          manager: manager.id,
          provider: this.deps.provider.model,
          status: "blocked",
          managerBrief: managerBrief.content,
          workerOutputs: [],
          finalSummary,
          approval
        };
      }
    }

    const workerIds =
      department.routingStrategy === "broadcast" ? department.workers : department.workers.slice(0, 1);

    const workerOutputs: TaskResult["workerOutputs"] = [];
    for (const workerId of workerIds) {
      const worker = this.getAgent(workerId);
      const skillId =
        worker.skills.find((skill) => task.requiredSkills.includes(skill)) ??
        (this.deps.config.policy.allowSkillFallback ? worker.skills[0] : undefined);

      if (!skillId) {
        throw new Error(`Worker '${worker.id}' cannot satisfy task '${task.id}'.`);
      }

      this.tracer.record({
        type: "skill.invoked",
        actor: worker.id,
        taskId: task.id,
        detail: `Invoking skill '${skillId}' for '${task.title}'.`
      });

      const context = {
        desiredOutput: task.desiredOutput,
        ownerDepartment: department.label,
        managerInstruction: manager.instruction,
        seedTopics: ["agent orchestration", "human oversight", "developer ergonomics"],
        headline: `${task.title} plan`,
        sections: ["Context", "Delivery plan", "Approval notes"]
      };

      const result = await this.deps.skills.run(skillId, task.title, context);
      const providerNote = await this.deps.provider.generate({
        agentId: worker.id,
        role: worker.role,
        task: task.title,
        objective: `Contribute ${task.desiredOutput} using ${skillId}.`,
        context
      });

      workerOutputs.push({
        workerId: worker.id,
        skillId,
        summary: result.summary,
        providerNote: providerNote.content
      });
    }

    const finalSummary = [
      `${department.label} coordinated by ${manager.role}.`,
      managerBrief.content,
      ...workerOutputs.map((output) => `${output.workerId} used ${output.skillId}.`),
      `Delivery target: ${task.desiredOutput}.`
    ].join(" ");

    await this.deps.memory.write({
      scope: task.ownerDepartment,
      key: task.id,
      value: finalSummary
    });

    if (approval) {
      await this.deps.memory.write({
        scope: task.ownerDepartment,
        key: `${task.id}:approval`,
        value: approval
      });
    }

    this.tracer.record({
      type: "task.completed",
      actor: manager.id,
      taskId: task.id,
      detail: `Task '${task.title}' completed.`,
      payload: { workerCount: workerOutputs.length, status: "completed" }
    });

    return {
      taskId: task.id,
      ownerDepartment: task.ownerDepartment,
      manager: manager.id,
      provider: this.deps.provider.model,
      status: "completed",
      managerBrief: managerBrief.content,
      workerOutputs,
      finalSummary,
      approval
    };
  }

  private async requestApproval(task: WorkflowTask, departmentLabel: string, managerBrief: string): Promise<ApprovalDecision> {
    if (!this.deps.approval) {
      throw new Error("Workflow requires human approval, but no approval handler is configured.");
    }

    return this.deps.approval.requestApproval({
      workflow: this.deps.config.name,
      taskId: task.id,
      taskTitle: task.title,
      department: departmentLabel,
      checkpoint: task.checkpoint ?? "Human approval required",
      managerBrief
    });
  }
}
