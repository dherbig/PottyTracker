# Deployment

Self-hosted via Docker Compose on your home network. The API serves the built PWA from the same origin.

## Docker Compose (recommended)

1. Copy environment template:

```bash
cp .env.example .env
```

2. Set a strong `API_KEY` in `.env`.

3. Build and run:

```bash
docker compose up --build -d
```

4. Open `http://<host-ip>:3000` on your phone and install the PWA.

Data persists in the `potty-data` Docker volume at `/data/potty.db`.

## Local development

Terminal 1 — API:

```bash
pnpm --filter @potty/api dev
```

Terminal 2 — Web (proxies `/api` to port 3000):

```bash
pnpm --filter @potty/web dev
```

Copy `software/apps/web/.env.example` to `software/apps/web/.env` if you need a custom API key locally.

## ESP32 configuration

Point the firmware at the same host:

- `API_BASE_URL`: `http://192.168.x.x:3000` (your server IP)
- `API_KEY`: same value as `API_KEY` in `.env`
- `DOG_ID`: UUID from `GET /api/dogs` for the target dog

See [firmware/esp32-clock/README.md](../../firmware/esp32-clock/README.md).
