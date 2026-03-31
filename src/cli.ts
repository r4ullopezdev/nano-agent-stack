#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import {
  exportRunJson,
  exportRunMarkdown,
  writeInspector
} from "nano-agent-observability";
import { demoSkills, SkillRegistry } from "nano-agent-skills";
import { catalog } from "nano-agent-templates";
import { loadApprovalHandler } from "./approval/loadApprovalHandler.js";
import { loadConfig } from "./config.js";
import { loadMemoryAdapter } from "./memory/loadMemoryAdapter.js";
import { toRunRecord } from "./observability/toRunRecord.js";
import { Orchestrator } from "./orchestrator/orchestrator.js";
import { loadProvider } from "./providers/loadProvider.js";
import { renderRunReport } from "./report.js";

async function main(): Promise<void> {
  const [, , command = "run", configPath = "examples/ceo-launch.yaml", ...flagArgs] = process.argv;
  const flags = {
    autoApprove: flagArgs.includes("--auto-approve"),
    autoReject: flagArgs.includes("--auto-reject"),
    reviewer: readFlagValue(flagArgs, "--reviewer"),
    approvalReason: readFlagValue(flagArgs, "--approval-reason")
  };

  if (command === "templates") {
    catalog.forEach((template) => {
      console.log(chalk.cyan(`${template.id} :: ${template.title}`));
      console.log(chalk.gray(`  ${template.purpose}`));
    });
    return;
  }

  if (command === "validate") {
    const config = loadConfig(configPath);
    console.log(chalk.green(`Validated workflow '${config.name}'.`));
    return;
  }

  if (command !== "run") {
    throw new Error(`Unsupported command '${command}'. Use: run <config> | validate <config> | templates.`);
  }

  const config = loadConfig(configPath);
  const registry = new SkillRegistry();
  demoSkills.forEach((skill) => registry.register(skill));
  const provider = loadProvider(config.provider);
  const memory = loadMemoryAdapter(config.memory);
  const approval = loadApprovalHandler(config, flags);

  const orchestrator = new Orchestrator({
    config,
    skills: registry,
    memory,
    provider,
    approval
  });

  const result = await orchestrator.run();
  const runRecord = toRunRecord(result);
  const report = renderRunReport(result);
  const outputPath = path.resolve("artifacts", "latest-run.md");
  const tracePath = path.resolve("artifacts", "latest-run.json");
  const traceMarkdownPath = path.resolve("artifacts", "latest-trace.md");
  const inspectorPath = path.resolve("artifacts", "latest-run-inspector.html");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, report, "utf8");
  fs.writeFileSync(tracePath, exportRunJson(runRecord), "utf8");
  fs.writeFileSync(traceMarkdownPath, exportRunMarkdown(runRecord), "utf8");
  writeInspector(runRecord, inspectorPath);

  console.log(chalk.cyan(report));
  console.log(chalk.green(`Saved report to ${outputPath}`));
  console.log(chalk.green(`Saved trace to ${tracePath}`));
  console.log(chalk.green(`Saved trace markdown to ${traceMarkdownPath}`));
  console.log(chalk.green(`Saved inspector to ${inspectorPath}`));
}

function readFlagValue(args: string[], flag: string): string | undefined {
  const directMatch = args.find((entry) => entry.startsWith(`${flag}=`));
  if (directMatch) {
    return directMatch.slice(flag.length + 1);
  }

  const flagIndex = args.indexOf(flag);
  if (flagIndex >= 0) {
    return args[flagIndex + 1];
  }

  return undefined;
}

main().catch((error) => {
  console.error(chalk.red(error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
});
