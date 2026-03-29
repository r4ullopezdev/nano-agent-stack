import type { RunResult } from "./types.js";

export function renderRunReport(result: RunResult): string {
  const taskLines = result.results
    .map((task) => {
      const workers = task.workerOutputs.map((entry) => `${entry.workerId}:${entry.skillId}`).join(", ");
      const notes = task.workerOutputs.map((entry) => `${entry.workerId}: ${entry.providerNote}`).join("\n  ");
      return `- ${task.taskId} | ${task.ownerDepartment} | ${task.provider} | ${workers}\n  Manager: ${task.managerBrief}\n  ${task.finalSummary}\n  ${notes}`;
    })
    .join("\n");

  const traceLines = result.trace.map((event) => `- ${event.type} | ${event.actor} | ${event.detail}`).join("\n");

  return `# ${result.workflow}\n\n## Task results\n${taskLines}\n\n## Trace\n${traceLines}\n`;
}
