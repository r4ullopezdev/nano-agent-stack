import type { TraceEvent } from "../types.js";

export class RunTracer {
  private readonly events: TraceEvent[] = [];

  record(event: Omit<TraceEvent, "at">): void {
    this.events.push({
      at: new Date().toISOString(),
      ...event
    });
  }

  list(): TraceEvent[] {
    return [...this.events];
  }
}
