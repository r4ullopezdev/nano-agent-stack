# Framework Comparison

This is a narrow, technical comparison intended to clarify scope, not market against other projects.

## LangGraph

- Strong fit when you want graph-oriented control flow and state transitions.
- `nano-agent-stack` is more opinionated about organizational structure: departments, managers, workers, and approval boundaries.
- If your primary abstraction is a graph, LangGraph may be the more direct tool. If your primary abstraction is a team or department hierarchy, `nano-agent-stack` is easier to reason about.

## CrewAI

- CrewAI emphasizes collaborative agent roles and task delegation flows.
- `nano-agent-stack` is intentionally smaller and lower-level. It focuses more on infrastructure boundaries such as policies, trace hooks, memory interfaces, and provider abstraction.
- CrewAI may be faster for higher-level agent app assembly. `nano-agent-stack` is more useful when you want to expose execution structure as reusable infrastructure.

## AutoGen

- AutoGen provides flexible multi-agent interaction patterns and model-centric workflows.
- `nano-agent-stack` puts more weight on explicit operational topology and auditable runtime boundaries.
- If you need conversational agent interplay first, AutoGen may be the stronger fit. If you need developer-facing infrastructure primitives for department-style orchestration, `nano-agent-stack` is narrower but more focused.

## Summary

`nano-agent-stack` is not trying to be the broadest agent framework. It is trying to be a clean open-source base for modeling organizations as auditable, human-supervised multi-agent systems.

