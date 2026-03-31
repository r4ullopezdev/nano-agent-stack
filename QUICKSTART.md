# Quickstart

## Requirements

- Node.js 20+

## Install

```bash
npm install
```

## Run the demo

```bash
npm run demo
```

## Run additional examples

```bash
npm run demo:content
npm run demo:support
npm run demo:openai
npm run demo:anthropic
```

## Validate a workflow config

```bash
npm run validate:demo
```

## List available templates

```bash
npm run templates
```

## Experimental provider setup

Export `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` before using remote providers. The included `examples/experimental-openai.yaml` shows the expected config shape.

The experimental provider demos use CLI-managed approvals:

```bash
npm run demo:openai
npm run demo:anthropic
```

## Human approval checkpoints

By default, workflows with `humanApprovalRequired: true` will ask for approval in an interactive terminal.

For scripted runs:

```bash
tsx src/cli.ts run examples/ceo-launch.yaml --auto-approve --reviewer ops-lead
tsx src/cli.ts run examples/ceo-launch.yaml --auto-reject --reviewer qa-lead --approval-reason "Needs revision"
```

## Run a custom config

```bash
npm run dev -- run path/to/workflow.yaml
```

## Validate quality gates

```bash
npm run lint
npm run test
npm run typecheck
```

## Expected output

The demo prints a markdown execution report and writes:

- `artifacts/latest-run.md`
- `artifacts/latest-run.json`
- `artifacts/latest-trace.md`
- `artifacts/latest-run-inspector.html`

When file memory is configured, additional persisted state files are written under `artifacts/`.
