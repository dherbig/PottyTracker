# Design Decisions

## ADR-001: Backend in Phase 1

**Decision:** Include Hono API + SQLite from the start, not local-only storage.

**Reason:** ESP32 clock sync requires shared state across devices.

## ADR-002: Temporal over Date

**Decision:** Use Temporal API with `temporal-polyfill` for all date/time logic.

**Reason:** Correct timezone and duration handling; Safari PWA needs polyfill.

## ADR-003: Multi-dog schema from day one

**Decision:** All events include `dogId`; UI starts with one default dog.

**Reason:** Avoid migration when adding a second dog later.

## ADR-004: TDD with coverage gates

**Decision:** Tests before implementation; Vitest coverage thresholds in CI.

**Reason:** Reliable behavior for sync-critical potty state logic.

## ADR-005: Self-hosted deployment

**Decision:** Docker Compose on home network; GitHub for source + CI only.

**Reason:** Personal/household use; no cloud dependency for runtime.

## ADR-006: Clear as event type

**Decision:** Clear inserts a `clear` event; state nulls when clear is most recent by insertion order.

**Reason:** Preserves audit trail; syncs to ESP32 like other actions.
