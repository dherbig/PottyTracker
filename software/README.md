# Potty Tracker — Software

TypeScript monorepo: React PWA + Hono API + shared packages.

**Not** the ESP32 firmware — see [`../firmware/`](../firmware/).

## Packages

| Path | Package | Role |
|------|---------|------|
| `apps/web` | `@potty/web` | React PWA |
| `apps/api` | `@potty/api` | Hono REST API + SQLite |
| `packages/shared` | `@potty/shared` | Types, state logic, Temporal utils |

## Commands

Run from **repository root** (pnpm workspace root):

```bash
pnpm install
pnpm test
pnpm dev
```

## Tests

TDD required — see `.cursor/rules/tdd-workflow.mdc`. Coverage thresholds apply to packages in this tree only.
