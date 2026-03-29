import { RunTracer } from "../observability/tracer.js";
import type { SkillRegistry } from "../skills/registry.js";
import type {
  AgentDefinition,
  DepartmentDefinition,
  MemoryAdapter,
  RunResult,
  RuntimeConfig,
  TaskResult,
  WorkflowTask
} from "../types.js";

type RuntimeDependencies = {
  config: RuntimeConfig;
  skills: SkillRegistry;
  memory: MemoryAdapter;
};

export class Orchestrator {
  private readonly tracer = new RunTracer();

  constructor(private readonly deps: RuntimeDependencies) {}

  async run(): Promise<RunResult> {
    const { config } = this.deps;

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
      results.push(await this.executeTask(task));
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
      trace: this.tracer.list()
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

    this.tracer.record({
      type: "task.started",
      actor: manager.id,
      taskId: task.id,
      detail: `Manager '${manager.role}' accepted task '${task.title}'.`
    });

    if (task.checkpoint && this.deps.config.policy.humanApprovalRequired) {
      this.tracer.record({
        type: "approval.checkpoint",
        actor: manager.id,
        taskId: task.id,
        detail: task.checkpoint
      });
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

      const result = await this.deps.skills.invoke(skillId, task.title, context);
      workerOutputs.push({
        workerId: worker.id,
        skillId,
        summary: result.summary
      });
    }

    const finalSummary = [
      `${department.label} coordinated by ${manager.role}.`,
      ...workerOutputs.map((output) => `${output.workerId} used ${output.skillId}.`),
      `Delivery target: ${task.desiredOutput}.`
    ].join(" ");

    await this.deps.memory.write({
      scope: task.ownerDepartment,
      key: task.id,
      value: finalSummary
    });

    this.tracer.record({
      type: "task.completed",
      actor: manager.id,
      taskId: task.id,
      detail: `Task '${task.title}' completed.`,
      payload: { workerCount: workerOutputs.length }
    });

    return {
      taskId: task.id,
      ownerDepartment: task.ownerDepartment,
      manager: manager.id,
      workerOutputs,
      finalSummary
    };
  }
}
