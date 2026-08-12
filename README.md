# Potty Tracker

Track when your dog was last taken out for a potty break. One git repo, **two independent codebases**:

| Codebase | Path | Stack |
|----------|------|-------|
| **Software** | [`software/`](software/) | React PWA + Hono API (pnpm / TypeScript) |
| **Firmware** | [`firmware/`](firmware/) | ESP32 motor clock (PlatformIO / C++) |

They integrate only through the **REST API** — no shared source code.

## Quick start (software)

```bash
pnpm install
pnpm test
pnpm dev
```

## Quick start (firmware)

See [firmware/esp32-clock/README.md](firmware/esp32-clock/README.md).

```bash
cd firmware/esp32-clock
pio run
```

## GitHub setup

1. Create a repository on GitHub
2. Add the remote:

```bash
git remote add origin git@github.com:YOUR_USER/PottyTracker.git
```

3. Push when ready (after review):

```bash
git push -u origin main
```

## Documentation

- [PLAN.md](PLAN.md) — development plan
- [AGENTS.md](AGENTS.md) — agent/workflow guide
- [docs/knowledge/](docs/knowledge/) — knowledge base
- [firmware/README.md](firmware/README.md) — firmware overview

## License

Private project.
