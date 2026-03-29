import type { MemoryAdapter, MemoryRecord } from "../types.js";

export class InMemoryAdapter implements MemoryAdapter {
  private readonly state = new Map<string, unknown>();

  async read(scope: string, key: string): Promise<unknown | undefined> {
    return this.state.get(`${scope}:${key}`);
  }

  async write(record: MemoryRecord): Promise<void> {
    const scope = record.scope ?? "global";
    this.state.set(`${scope}:${record.key}`, record.value);
  }
}

