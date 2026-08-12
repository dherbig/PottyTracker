# ESP32 Motor Clock — Firmware

Standalone **PlatformIO / C++** codebase. Not part of the pnpm workspace in `software/`.

## Relationship to software

This firmware talks to the Potty Tracker API over WiFi. It does not share TypeScript code with the PWA — the **REST API contract** is the integration boundary:

| Action | HTTP |
|--------|------|
| Poll state | `GET /api/dogs/:dogId/state` |
| Log outing | `POST /api/dogs/:dogId/events` `{ "hadPoop": false \| true }` |
| Clear display | `POST /api/dogs/:dogId/clear` |

Auth: `X-API-Key` header on all requests.

See [docs/knowledge/esp32-clock.md](../../docs/knowledge/esp32-clock.md) and [docs/knowledge/architecture.md](../../docs/knowledge/architecture.md).

## Prerequisites

- [PlatformIO](https://platformio.org/) (VS Code extension or CLI)

## Build & upload

```bash
cd firmware/esp32-clock
pio run
pio run -t upload
pio device monitor
```

## Configuration

Copy `include/config.example.h` to `include/config.h` (gitignored) and set WiFi, API URL, API key, and dog ID.
