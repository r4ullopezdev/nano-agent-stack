import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import type { RuntimeConfig } from "./types.js";

export function loadConfig(filePath: string): RuntimeConfig {
  const absolutePath = path.resolve(filePath);
  const raw = fs.readFileSync(absolutePath, "utf8");
  return yaml.load(raw) as RuntimeConfig;
}

