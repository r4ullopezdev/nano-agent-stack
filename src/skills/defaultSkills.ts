import type { SkillDefinition } from "../types.js";

export const defaultSkills: SkillDefinition[] = [
  {
    id: "task-classifier",
    description: "Derives task intent and delivery format.",
    handler: ({ task }) => ({
      summary: `Classified task intent for '${task}'.`,
      data: {
        category: task.includes("launch") ? "go-to-market" : "general-ops",
        outputFormat: "markdown"
      }
    })
  },
  {
    id: "research-brief",
    description: "Produces a concise research brief from supplied context.",
    handler: ({ task, context }) => ({
      summary: `Prepared research brief for '${task}'.`,
      data: {
        sources: context.seedTopics ?? [],
        risks: ["Model provider abstraction still pending", "Persistent memory is experimental"]
      }
    })
  },
  {
    id: "markdown-report",
    description: "Formats structured output as a publication-ready markdown report.",
    handler: ({ task, context }) => ({
      summary: `Rendered markdown report for '${task}'.`,
      data: {
        headline: context.headline ?? "Operational update",
        sections: context.sections ?? ["Summary", "Decisions", "Next steps"]
      }
    })
  }
];

