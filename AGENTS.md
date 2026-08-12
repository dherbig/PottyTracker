# Potty Tracker — Agent Guide

## Repository layout

This repo contains **two separate codebases** that share only documentation and the HTTP API contract:

```
software/     TypeScript monorepo (PWA + API) — pnpm, Vitest, TDD
firmware/     ESP32 embedded projects — PlatformIO, C++ (not in pnpm workspace)
docs/         Knowledge base (both codebases)
```

## Commands (software)

Run from **repository root**:

| Command | Purpose |
|---------|---------|
| `pnpm install` | Install software dependencies |
| `pnpm dev` | Run API + web in dev mode |
| `pnpm test` | Run all software tests |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm typecheck` | Typecheck all software packages |
| `pnpm build` | Build all software packages |

## Commands (firmware)

Run from **`firmware/esp32-clock/`** (PlatformIO, not pnpm):

| Command | Purpose |
|---------|---------|
| `pio run` | Build firmware |
| `pio run -t upload` | Flash to ESP32 |
| `pio device monitor` | Serial monitor |

## Workflow

1. Read [PLAN.md](PLAN.md) and relevant [docs/knowledge/](docs/knowledge/) docs
2. Follow TDD for **software** changes (see `.cursor/rules/tdd-workflow.mdc`)
3. Use Temporal for all date/time logic in software (see `docs/knowledge/temporal.md`)
4. Firmware uses ISO 8601 strings over HTTP — no Temporal, no shared TS packages

## Git policy

- **Ask the user before every commit**
- **Ask the user before every push** — never push without explicit approval

See `.cursor/rules/git-policy.mdc`.

## Software structure

```
software/apps/web/       React PWA
software/apps/api/       Hono REST API
software/packages/shared Types, state logic, time utilities
```

## Firmware structure

```
firmware/esp32-clock/    Motor clock + buttons (PlatformIO)
```
