# ESP32 Motor Clock

> Firmware codebase: [`firmware/esp32-clock/`](../../firmware/esp32-clock/)

Motor-controlled physical clock. Independent **PlatformIO / C++** project — not part of the pnpm workspace.

## API integration

| Action | Request |
|--------|---------|
| Poll state | `GET /api/dogs/:dogId/state` |
| Log Out | `POST /api/dogs/:dogId/events` `{ "hadPoop": false }` |
| Log Poop | `POST /api/dogs/:dogId/events` `{ "hadPoop": true }` |
| Clear | `POST /api/dogs/:dogId/clear` |

Header: `X-API-Key: <key>`

Response field `lastOutAt` is ISO 8601 UTC (e.g. `2026-08-12T17:30:00Z`). Map to motor positions for clock hands. When `isCleared` is true, show empty/cleared position.

## Phase 3 scope

- WiFi + config via `include/config.h`
- Poll every ~30s
- Button debounce → POST events (no client timestamp)
- Stepper/servo → hour/minute hands from `lastOutAt`

Hardware specifics TBD after software infrastructure is working.
