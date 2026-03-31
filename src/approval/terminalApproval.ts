import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type { ApprovalDecision, ApprovalHandler, ApprovalRequest } from "../types.js";

export class TerminalApprovalHandler implements ApprovalHandler {
  constructor(private readonly reviewer = "terminal-reviewer") {}

  async requestApproval(request: ApprovalRequest): Promise<ApprovalDecision> {
    if (!input.isTTY || !output.isTTY) {
      throw new Error(
        "Human approval requires an interactive terminal. Re-run locally or pass --auto-approve/--auto-reject."
      );
    }

    const rl = createInterface({ input, output });

    try {
      output.write(`\n[Approval checkpoint] ${request.workflow} :: ${request.taskTitle}\n`);
      output.write(`Department: ${request.department}\n`);
      output.write(`Checkpoint: ${request.checkpoint}\n`);
      output.write(`Manager brief: ${request.managerBrief}\n\n`);

      const answer = (await rl.question("Approve this task? [y/N]: ")).trim().toLowerCase();
      const note = (await rl.question("Reviewer note (optional): ")).trim();
      const approved = answer === "y" || answer === "yes";

      return {
        taskId: request.taskId,
        checkpoint: request.checkpoint,
        approved,
        reviewer: this.reviewer,
        reason: note || undefined,
        at: new Date().toISOString()
      };
    } finally {
      rl.close();
    }
  }
}
