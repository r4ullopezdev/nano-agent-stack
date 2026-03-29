import { describe, expect, test } from "vitest";
import { InMemoryAdapter } from "../src/memory/inMemory.js";
import { Orchestrator } from "../src/orchestrator/orchestrator.js";
import { defaultSkills } from "../src/skills/defaultSkills.js";
import { SkillRegistry } from "../src/skills/registry.js";
import type { RuntimeConfig } from "../src/types.js";

describe("Orchestrator", () => {
  test("executes a department-routed task and records trace events", async () => {
    const registry = new SkillRegistry();
    registry.registerMany(defaultSkills);

    const config: RuntimeConfig = {
      name: "test-run",
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
          skills: ["research-brief"],
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
          requiredSkills: ["research-brief"],
          checkpoint: "Needs human review"
        }
      ]
    };

    const orchestrator = new Orchestrator({
      config,
      skills: registry,
      memory: new InMemoryAdapter()
    });

    const result = await orchestrator.run();

    expect(result.results).toHaveLength(1);
    expect(result.results[0].workerOutputs[0].skillId).toBe("research-brief");
    expect(result.trace.some((event) => event.type === "approval.checkpoint")).toBe(true);
  });
});

