import path from "node:path";
import { FileMemoryAdapter } from "./fileMemory.js";
import { InMemoryAdapter } from "./inMemory.js";
import { SqliteMemoryAdapter } from "./sqliteMemory.js";
import type { MemoryAdapter, MemoryConfig } from "../types.js";

export function loadMemoryAdapter(config?: MemoryConfig): MemoryAdapter {
  if (!config || config.kind === "in-memory") {
    return new InMemoryAdapter();
  }

  if (config.kind === "file") {
    const filePath = config.options?.filePath ?? path.resolve("artifacts", "memory.json");
    return new FileMemoryAdapter(filePath);
  }

  if (config.kind === "sqlite") {
    const dbPath = config.options?.dbPath ?? path.resolve("artifacts", "memory.sqlite");
    const tableName = config.options?.tableName ?? "memory_records";
    return new SqliteMemoryAdapter(dbPath, tableName);
  }

  return new InMemoryAdapter();
}
