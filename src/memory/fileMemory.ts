import fs from "node:fs";
import path from "node:path";
import type { MemoryAdapter, MemoryRecord } from "../types.js";

type StoreShape = Record<string, unknown>;

export class FileMemoryAdapter implements MemoryAdapter {
  private readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = path.resolve(filePath);
  }

  async read(scope: string, key: string): Promise<unknown | undefined> {
    const store = this.readStore();
    return store[`${scope}:${key}`];
  }

  async write(record: MemoryRecord): Promise<void> {
    const scope = record.scope ?? "global";
    const store = this.readStore();
    store[`${scope}:${record.key}`] = record.value;
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(store, null, 2), "utf8");
  }

  private readStore(): StoreShape {
    if (!fs.existsSync(this.filePath)) {
      return {};
    }

    const raw = fs.readFileSync(this.filePath, "utf8");
    return JSON.parse(raw) as StoreShape;
  }
}

