# Potty Tracker — Agent Guide

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm install` | Install dependencies |
| `pnpm dev` | Run API + web in dev mode |
| `pnpm test` | Run all tests |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm typecheck` | Typecheck all packages |
| `pnpm build` | Build all packages |

## Workflow

1. Read [PLAN.md](PLAN.md) and relevant [docs/knowledge/](docs/knowledge/) docs
2. Follow TDD: tests first, then implementation (see `.cursor/rules/tdd-workflow.mdc`)
3. Use Temporal for all date/time logic (see `docs/knowledge/temporal.md`)

## Git policy

- **Ask the user before every commit**
- **Ask the user before every push** — never push without explicit approval

See `.cursor/rules/git-policy.mdc`.

## Project structure

```
apps/web/       React PWA
apps/api/       Hono REST API
packages/shared Types, state logic, time utilities
docs/knowledge/ Reference documentation
.cursor/rules/  Agent control files
```
