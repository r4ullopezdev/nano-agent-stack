import { describe, expect, test } from "vitest";
import { demoSkills, SkillRegistry } from "nano-agent-skills";
import { InMemoryAdapter } from "../src/memory/inMemory.js";
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
      provider: new StaticScenarioProvider("test-provider")
    });

    const result = await orchestrator.run();

    expect(result.results).toHaveLength(1);
    expect(result.results[0].workerOutputs[0].skillId).toBe("web-research-stub");
    expect(result.results[0].provider).toBe("test-provider");
    expect(result.trace.some((event) => event.type === "approval.checkpoint")).toBe(true);
  });
});
