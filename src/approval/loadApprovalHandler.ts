import { StaticApprovalHandler } from "./staticApproval.js";
import { TerminalApprovalHandler } from "./terminalApproval.js";
import type { ApprovalHandler, RuntimeConfig } from "../types.js";

type CliFlags = {
  autoApprove: boolean;
  autoReject: boolean;
  reviewer?: string;
  approvalReason?: string;
};

export function loadApprovalHandler(config: RuntimeConfig, flags: CliFlags): ApprovalHandler | undefined {
  if (!config.policy.humanApprovalRequired) {
    return undefined;
  }

  if (flags.autoApprove) {
    return new StaticApprovalHandler({
      approved: true,
      reviewer: flags.reviewer ?? "auto-approve",
      reason: flags.approvalReason ?? "Automatically approved from CLI flag."
    });
  }

  if (flags.autoReject) {
    return new StaticApprovalHandler({
      approved: false,
      reviewer: flags.reviewer ?? "auto-reject",
      reason: flags.approvalReason ?? "Automatically rejected from CLI flag."
    });
  }

  return new TerminalApprovalHandler(flags.reviewer ?? "human-reviewer");
}
