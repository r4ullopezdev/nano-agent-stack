import type { RunResult } from "./types.js";

export function renderRunReport(result: RunResult): string {
  const taskLines = result.results
    .map((task) => {
      const workers = task.workerOutputs.map((entry) => `${entry.workerId}:${entry.skillId}`).join(", ");
      const notes = task.workerOutputs.map((entry) => `${entry.workerId}: ${entry.providerNote}`).join("\n  ");
      const approvalLine = task.approval
        ? `\n  Approval: ${task.approval.approved ? "approved" : "rejected"} by ${task.approval.reviewer}${task.approval.reason ? ` (${task.approval.reason})` : ""}`
        : "";
      return `- ${task.taskId} | ${task.ownerDepartment} | ${task.provider} | ${task.status} | ${workers || "no-workers"}\n  Manager: ${task.managerBrief}${approvalLine}\n  ${task.finalSummary}${notes ? `\n  ${notes}` : ""}`;
    })
    .join("\n");

  const traceLines = result.trace.map((event) => `- ${event.type} | ${event.actor} | ${event.detail}`).join("\n");
  const approvalLines =
    result.approvals.length > 0
      ? result.approvals
          .map(
            (approval) =>
              `- ${approval.taskId} | ${approval.approved ? "approved" : "rejected"} | ${approval.reviewer}${approval.reason ? ` | ${approval.reason}` : ""}`
          )
          .join("\n")
      : "- No approval checkpoints triggered.";

  return `# ${result.workflow}\n\n## Task results\n${taskLines}\n\n## Approvals\n${approvalLines}\n\n## Trace\n${traceLines}\n`;
}
