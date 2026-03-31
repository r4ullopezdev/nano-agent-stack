import type { ApprovalDecision, ApprovalHandler, ApprovalRequest } from "../types.js";

type StaticApprovalOptions = {
  approved: boolean;
  reviewer?: string;
  reason?: string;
};

export class StaticApprovalHandler implements ApprovalHandler {
  private readonly reviewer: string;
  private readonly reason?: string;

  constructor(private readonly options: StaticApprovalOptions) {
    this.reviewer = options.reviewer ?? "static-approval";
    this.reason = options.reason;
  }

  async requestApproval(request: ApprovalRequest): Promise<ApprovalDecision> {
    return {
      taskId: request.taskId,
      checkpoint: request.checkpoint,
      approved: this.options.approved,
      reviewer: this.reviewer,
      reason: this.reason,
      at: new Date().toISOString()
    };
  }
}
