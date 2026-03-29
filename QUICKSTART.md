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
```

## Experimental provider setup

Export `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` before using remote providers. The included `examples/experimental-openai.yaml` shows the expected config shape.

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
