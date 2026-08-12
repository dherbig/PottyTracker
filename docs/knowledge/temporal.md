# Temporal Usage

## Rules

1. **Never use `Date`** for business logic
2. **Store** UTC ISO strings in SQLite (`Temporal.Instant.toString()`)
3. **Parse** with `Temporal.Instant.from(iso)`
4. **Display** local time via `instant.toZonedDateTimeISO(Temporal.Now.timeZoneId())`
5. **Validate** future timestamps with `Temporal.Instant.compare()`

## Polyfill

Import at app entry points:

```typescript
import "temporal-polyfill/global";
```

Required for Safari/iOS PWA until native Temporal ships.

## Shared utilities

Live in `packages/shared/src/time.ts` (Phase 1).
