import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { z } from "zod";
import type { RuntimeConfig } from "./types.js";

const runtimeConfigSchema = z.object({
  name: z.string().min(1),
  provider: z.object({
    kind: z.enum(["static-scenario", "echo", "openai-responses", "anthropic-messages"]),
    model: z.string().min(1),
    options: z.record(z.unknown()).optional()
  }),
  memory: z
    .object({
      kind: z.enum(["in-memory", "file"]),
      options: z
        .object({
          filePath: z.string().min(1).optional()
        })
        .optional()
    })
    .optional(),
  policy: z.object({
    maxTasksPerRun: z.number().int().positive(),
    humanApprovalRequired: z.boolean(),
    allowSkillFallback: z.boolean()
  }),
  agents: z.array(
    z.object({
      id: z.string().min(1),
      role: z.string().min(1),
      department: z.string().min(1),
      skills: z.array(z.string().min(1)).min(1),
      instruction: z.string().min(1)
    })
  ),
  departments: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      manager: z.string().min(1),
      workers: z.array(z.string().min(1)).min(1),
      routingStrategy: z.enum(["broadcast", "sequential"])
    })
  ),
  tasks: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      ownerDepartment: z.string().min(1),
      desiredOutput: z.string().min(1),
      requiredSkills: z.array(z.string().min(1)).min(1),
      checkpoint: z.string().optional()
    })
  )
});

export function loadConfig(filePath: string): RuntimeConfig {
  const absolutePath = path.resolve(filePath);
  const raw = fs.readFileSync(absolutePath, "utf8");
  const parsed = runtimeConfigSchema.parse(yaml.load(raw));
  validateRuntimeReferences(parsed);
  return parsed as RuntimeConfig;
}

function validateRuntimeReferences(config: RuntimeConfig): void {
  const agentIds = new Set(config.agents.map((agent) => agent.id));
  const departmentIds = new Set(config.departments.map((department) => department.id));

  for (const department of config.departments) {
    if (!agentIds.has(department.manager)) {
      throw new Error(`Department '${department.id}' references missing manager '${department.manager}'.`);
    }

    for (const workerId of department.workers) {
      if (!agentIds.has(workerId)) {
        throw new Error(`Department '${department.id}' references missing worker '${workerId}'.`);
      }
    }
  }

  for (const task of config.tasks) {
    if (!departmentIds.has(task.ownerDepartment)) {
      throw new Error(`Task '${task.id}' references missing department '${task.ownerDepartment}'.`);
    }
  }
}
