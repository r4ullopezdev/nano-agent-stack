import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { MemoryAdapter, MemoryRecord } from "../types.js";

export class SqliteMemoryAdapter implements MemoryAdapter {
  private readonly database: DatabaseSync;
  private readonly tableName: string;

  constructor(dbPath: string, tableName = "memory_records") {
    const resolvedPath = path.resolve(dbPath);
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    this.database = new DatabaseSync(resolvedPath);
    this.tableName = sanitizeIdentifier(tableName);
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        scope TEXT NOT NULL,
        key TEXT NOT NULL,
        value_json TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (scope, key)
      )
    `);
  }

  async read(scope: string, key: string): Promise<unknown | undefined> {
    const statement = this.database.prepare(
      `SELECT value_json FROM ${this.tableName} WHERE scope = ? AND key = ?`
    );
    const row = statement.get(scope, key) as { value_json?: string } | undefined;
    return row?.value_json ? (JSON.parse(row.value_json) as unknown) : undefined;
  }

  async write(record: MemoryRecord): Promise<void> {
    const scope = record.scope ?? "global";
    const statement = this.database.prepare(`
      INSERT INTO ${this.tableName} (scope, key, value_json, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(scope, key)
      DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at
    `);

    statement.run(scope, record.key, JSON.stringify(record.value), new Date().toISOString());
  }

  close(): void {
    this.database.close();
  }
}

function sanitizeIdentifier(identifier: string): string {
  return identifier.replaceAll(/[^a-zA-Z0-9_]/g, "_");
}
