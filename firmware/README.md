# Firmware

Embedded code for the Potty Tracker hardware. Each subdirectory is an **independent codebase** with its own toolchain (not managed by pnpm).

| Project | Description | Toolchain |
|---------|-------------|-----------|
| [esp32-clock/](esp32-clock/) | Motor-driven physical clock + Out/Poop buttons | PlatformIO / Arduino / C++ |

Integration with the web app happens only through the HTTP API documented in [docs/knowledge/](../docs/knowledge/).
