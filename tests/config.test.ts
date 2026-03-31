import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { loadConfig } from "../src/config.js";
import { FileMemoryAdapter } from "../src/memory/fileMemory.js";
import { SqliteMemoryAdapter } from "../src/memory/sqliteMemory.js";

describe("config loading", () => {
  test("loads and validates a workflow config", () => {
    const config = loadConfig("examples/ceo-launch.yaml");
    expect(config.name).toBe("ceo-launch-demo");
    expect(config.provider.kind).toBe("static-scenario");
  });

  test("persists memory records to disk", async () => {
    const filePath = path.resolve("artifacts", "test-memory.json");
    fs.rmSync(filePath, { force: true });

    const adapter = new FileMemoryAdapter(filePath);
    await adapter.write({
      scope: "research",
      key: "task-1",
      value: { status: "done" }
    });

    const value = await adapter.read("research", "task-1");
    expect(value).toEqual({ status: "done" });
    fs.rmSync(filePath, { force: true });
  });

  test("persists memory records to sqlite", async () => {
    const dbPath = path.resolve("artifacts", "test-memory.sqlite");
    fs.rmSync(dbPath, { force: true });

    const adapter = new SqliteMemoryAdapter(dbPath);
    await adapter.write({
      scope: "research",
      key: "task-2",
      value: { status: "approved", reviewer: "qa-lead" }
    });

    const value = await adapter.read("research", "task-2");
    expect(value).toEqual({ status: "approved", reviewer: "qa-lead" });
    adapter.close();
    fs.rmSync(dbPath, { force: true });
  });
});
