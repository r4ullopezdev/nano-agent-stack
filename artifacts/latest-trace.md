# Run support-triage-demo-2026-03-29T17-53-53-309Z

- Workflow: support-triage-demo
- Status: completed

## Events
- 2026-03-29T17:53:53.309Z | info | run.started | orchestrator | Starting workflow 'support-triage-demo'.
- 2026-03-29T17:53:53.309Z | info | task.started | support-manager | Manager 'Support Triage Manager' accepted task 'Triage a high-priority support queue'.
- 2026-03-29T17:53:53.310Z | info | approval.checkpoint | support-manager | Human review required before customer-facing response
- 2026-03-29T17:53:53.310Z | info | skill.invoked | classifier | Invoking skill 'task-classifier' for 'Triage a high-priority support queue'.
- 2026-03-29T17:53:53.310Z | info | skill.invoked | formatter | Invoking skill 'structured-output-formatter' for 'Triage a high-priority support queue'.
- 2026-03-29T17:53:53.310Z | info | task.completed | support-manager | Task 'Triage a high-priority support queue' completed.
- 2026-03-29T17:53:53.310Z | info | run.completed | orchestrator | Completed workflow 'support-triage-demo'.
