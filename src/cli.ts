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
import { loadConfig } from "./config.js";
import { InMemoryAdapter } from "./memory/inMemory.js";
import { toRunRecord } from "./observability/toRunRecord.js";
import { Orchestrator } from "./orchestrator/orchestrator.js";
import { loadProvider } from "./providers/loadProvider.js";
import { renderRunReport } from "./report.js";

async function main(): Promise<void> {
  const [, , command = "run", configPath = "examples/ceo-launch.yaml"] = process.argv;

  if (command !== "run") {
    throw new Error(`Unsupported command '${command}'. Use: run <config>.`);
  }

  const config = loadConfig(configPath);
  const registry = new SkillRegistry();
  demoSkills.forEach((skill) => registry.register(skill));
  const provider = loadProvider(config.provider);

  const orchestrator = new Orchestrator({
    config,
    skills: registry,
    memory: new InMemoryAdapter(),
    provider
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

main().catch((error) => {
  console.error(chalk.red(error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
});
