# Architecture

## Overview

Potty Tracker is a monorepo with a React PWA, Hono API, and shared TypeScript package. An ESP32 motor clock will sync via REST in Phase 3.

## Data flow

1. User taps Out/Poop/Clear in PWA (or on ESP32 buttons)
2. Client POSTs to `/api/dogs/:dogId/events` or `/clear`
3. API persists event to SQLite, computes `PottyState`
4. Clients poll or fetch state to update display

## Key packages

- `@potty/shared` — types, `computePottyState()`, Temporal utilities
- `@potty/api` — Hono server, SQLite persistence
- `@potty/web` — React PWA

See [PLAN.md](../../PLAN.md) for full details.
