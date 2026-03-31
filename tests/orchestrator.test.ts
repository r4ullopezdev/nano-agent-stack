import { describe, expect, test } from "vitest";
import { demoSkills, SkillRegistry } from "nano-agent-skills";
import { InMemoryAdapter } from "../src/memory/inMemory.js";
import { StaticApprovalHandler } from "../src/approval/staticApproval.js";
import { Orchestrator } from "../src/orchestrator/orchestrator.js";
import { StaticScenarioProvider } from "../src/providers/staticScenarioProvider.js";
import type { RuntimeConfig } from "../src/types.js";

describe("Orchestrator", () => {
  test("executes a department-routed task and records trace events", async () => {
    const registry = new SkillRegistry();
    demoSkills.forEach((skill) => registry.register(skill));

    const config: RuntimeConfig = {
      name: "test-run",
      provider: {
        kind: "static-scenario",
        model: "test-provider"
      },
      policy: {
        maxTasksPerRun: 2,
        humanApprovalRequired: true,
        allowSkillFallback: true
      },
      agents: [
        {
          id: "manager",
          role: "Manager",
          department: "research",
          skills: ["task-classifier"],
          instruction: "Coordinate work."
        },
        {
          id: "worker",
          role: "Worker",
          department: "research",
          skills: ["web-research-stub"],
          instruction: "Produce a brief."
        }
      ],
      departments: [
        {
          id: "research",
          label: "Research",
          manager: "manager",
          workers: ["worker"],
          routingStrategy: "broadcast"
        }
      ],
      tasks: [
        {
          id: "task-1",
          title: "Assemble benchmark brief",
          ownerDepartment: "research",
          desiredOutput: "Markdown memo",
          requiredSkills: ["web-research-stub"],
          checkpoint: "Needs human review"
        }
      ]
    };

    const orchestrator = new Orchestrator({
      config,
      skills: registry,
      memory: new InMemoryAdapter(),
      provider: new StaticScenarioProvider("test-provider"),
      approval: new StaticApprovalHandler({
        approved: true,
        reviewer: "qa-reviewer",
        reason: "Ready for execution"
      })
    });

    const result = await orchestrator.run();

    expect(result.results).toHaveLength(1);
    expect(result.results[0].workerOutputs[0].skillId).toBe("web-research-stub");
    expect(result.results[0].provider).toBe("test-provider");
    expect(result.results[0].status).toBe("completed");
    expect(result.results[0].approval?.approved).toBe(true);
    expect(result.approvals).toHaveLength(1);
    expect(result.trace.some((event) => event.type === "approval.requested")).toBe(true);
    expect(result.trace.some((event) => event.type === "approval.approved")).toBe(true);
  });

  test("blocks a task when approval is rejected", async () => {
    const registry = new SkillRegistry();
    demoSkills.forEach((skill) => registry.register(skill));

    const config: RuntimeConfig = {
      name: "blocked-run",
      provider: {
        kind: "static-scenario",
        model: "test-provider"
      },
      policy: {
        maxTasksPerRun: 1,
        humanApprovalRequired: true,
        allowSkillFallback: true
      },
      agents: [
        {
          id: "manager",
          role: "Manager",
          department: "research",
          skills: ["task-classifier"],
          instruction: "Coordinate work."
        },
        {
          id: "worker",
          role: "Worker",
          department: "research",
          skills: ["web-research-stub"],
          instruction: "Produce a brief."
        }
      ],
      departments: [
        {
          id: "research",
          label: "Research",
          manager: "manager",
          workers: ["worker"],
          routingStrategy: "broadcast"
        }
      ],
      tasks: [
        {
          id: "task-1",
          title: "Assemble benchmark brief",
          ownerDepartment: "research",
          desiredOutput: "Markdown memo",
          requiredSkills: ["web-research-stub"],
          checkpoint: "Needs human review"
        }
      ]
    };

    const orchestrator = new Orchestrator({
      config,
      skills: registry,
      memory: new InMemoryAdapter(),
      provider: new StaticScenarioProvider("test-provider"),
      approval: new StaticApprovalHandler({
        approved: false,
        reviewer: "qa-reviewer",
        reason: "Needs revision"
      })
    });

    const result = await orchestrator.run();

    expect(result.results[0].status).toBe("blocked");
    expect(result.results[0].workerOutputs).toHaveLength(0);
    expect(result.results[0].approval?.approved).toBe(false);
    expect(result.trace.some((event) => event.type === "approval.rejected")).toBe(true);
  });
});
